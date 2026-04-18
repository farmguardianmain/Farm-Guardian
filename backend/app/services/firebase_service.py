import os
import json
import base64
from copy import deepcopy
from firebase_admin import credentials, firestore, initialize_app, get_app
from typing import Dict, List, Any, Optional

class FirebaseService:
    def __init__(self):
        self.db = None
        self.mode = "mock"
        self._mock_store: Dict[str, Dict[str, Dict[str, Any]]] = {}
        self._initialize_firebase()

    def _parse_service_account_json(self, raw_json: str) -> Dict[str, Any]:
        """Parse service account JSON from plain JSON or base64 encoded JSON."""
        try:
            return json.loads(raw_json)
        except json.JSONDecodeError:
            try:
                decoded = base64.b64decode(raw_json).decode("utf-8")
                return json.loads(decoded)
            except Exception as base64_error:
                raise ValueError(
                    "FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON or base64-encoded JSON"
                ) from base64_error
    
    def _initialize_firebase(self):
        """Initialize Firebase with service account credentials"""
        try:
            # Option 1: Render-friendly raw JSON secret.
            cred_json = os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON", "").strip()
            if cred_json:
                service_account_info = self._parse_service_account_json(cred_json)
                cred = credentials.Certificate(service_account_info)

                try:
                    get_app()
                except ValueError:
                    initialize_app(cred)

                self.db = firestore.client()
                self.mode = "firestore"
                project_id = service_account_info.get("project_id", "unknown")
                print(
                    f"✅ Firebase initialized successfully (project: {project_id}, source: FIREBASE_SERVICE_ACCOUNT_JSON)"
                )
                return

            # Option 2: Local file path.
            cred_path = os.getenv("FIREBASE_SERVICE_ACCOUNT_KEY", "service-account-key.json")
            
            if os.path.exists(cred_path):
                cred = credentials.Certificate(cred_path)

                try:
                    get_app()
                except ValueError:
                    initialize_app(cred)

                self.db = firestore.client()
                self.mode = "firestore"
                print(f"✅ Firebase initialized successfully (source: {cred_path})")
            else:
                print("⚠️  Firebase service account key not found. Using in-memory mock mode.")
                self.db = None
                self.mode = "mock"
        except Exception as e:
            print(f"❌ Firebase initialization failed: {e}")
            self.db = None
            self.mode = "mock"
    
    async def create_document(self, collection: str, doc_id: str, data: Dict[str, Any]) -> bool:
        """Create a document in Firestore"""
        if not self.db:
            return await self._mock_create_document(collection, doc_id, data)
        
        try:
            doc_ref = self.db.collection(collection).document(doc_id)
            doc_ref.set(data)
            return True
        except Exception as e:
            print(f"❌ Error creating document: {e}")
            return False
    
    async def get_document(self, collection: str, doc_id: str) -> Optional[Dict[str, Any]]:
        """Get a document from Firestore"""
        if not self.db:
            return await self._mock_get_document(collection, doc_id)
        
        try:
            doc_ref = self.db.collection(collection).document(doc_id)
            doc = doc_ref.get()
            if doc.exists:
                return doc.to_dict()
            return None
        except Exception as e:
            print(f"❌ Error getting document: {e}")
            return None
    
    async def update_document(self, collection: str, doc_id: str, data: Dict[str, Any]) -> bool:
        """Update a document in Firestore"""
        if not self.db:
            return await self._mock_update_document(collection, doc_id, data)
        
        try:
            doc_ref = self.db.collection(collection).document(doc_id)
            doc_ref.update(data)
            return True
        except Exception as e:
            print(f"❌ Error updating document: {e}")
            return False
    
    async def delete_document(self, collection: str, doc_id: str) -> bool:
        """Delete a document from Firestore"""
        if not self.db:
            return await self._mock_delete_document(collection, doc_id)
        
        try:
            doc_ref = self.db.collection(collection).document(doc_id)
            doc_ref.delete()
            return True
        except Exception as e:
            print(f"❌ Error deleting document: {e}")
            return False
    
    async def get_collection(self, collection: str) -> List[Dict[str, Any]]:
        """Get all documents from a collection"""
        if not self.db:
            return await self._mock_get_collection(collection)
        
        try:
            docs = self.db.collection(collection).stream()
            return [doc.to_dict() for doc in docs]
        except Exception as e:
            print(f"❌ Error getting collection: {e}")
            return []
    
    async def query_documents(self, collection: str, field: str, operator: str, value: Any) -> List[Dict[str, Any]]:
        """Query documents in a collection"""
        if not self.db:
            return await self._mock_query_documents(collection, field, operator, value)
        
        try:
            docs = self.db.collection(collection).where(field, operator, value).stream()
            return [doc.to_dict() for doc in docs]
        except Exception as e:
            print(f"❌ Error querying documents: {e}")
            return []
    
    # Mock methods for development without Firebase
    async def _mock_create_document(self, collection: str, doc_id: str, data: Dict[str, Any]) -> bool:
        collection_store = self._mock_store.setdefault(collection, {})
        collection_store[doc_id] = deepcopy(data)
        print(f"🔧 Mock[{self.mode}]: Creating {collection}/{doc_id}")
        return True
    
    async def _mock_get_document(self, collection: str, doc_id: str) -> Optional[Dict[str, Any]]:
        collection_store = self._mock_store.get(collection, {})
        document = collection_store.get(doc_id)
        print(f"🔧 Mock[{self.mode}]: Getting {collection}/{doc_id}")
        return deepcopy(document) if document else None
    
    async def _mock_update_document(self, collection: str, doc_id: str, data: Dict[str, Any]) -> bool:
        collection_store = self._mock_store.setdefault(collection, {})
        if doc_id not in collection_store:
            return False

        updated = deepcopy(collection_store[doc_id])
        updated.update(deepcopy(data))
        collection_store[doc_id] = updated
        print(f"🔧 Mock[{self.mode}]: Updating {collection}/{doc_id}")
        return True
    
    async def _mock_delete_document(self, collection: str, doc_id: str) -> bool:
        collection_store = self._mock_store.setdefault(collection, {})
        existed = doc_id in collection_store
        collection_store.pop(doc_id, None)
        print(f"🔧 Mock[{self.mode}]: Deleting {collection}/{doc_id}")
        return existed
    
    async def _mock_get_collection(self, collection: str) -> List[Dict[str, Any]]:
        collection_store = self._mock_store.get(collection, {})
        print(f"🔧 Mock[{self.mode}]: Getting collection {collection}")
        return [deepcopy(document) for document in collection_store.values()]
    
    async def _mock_query_documents(self, collection: str, field: str, operator: str, value: Any) -> List[Dict[str, Any]]:
        collection_store = self._mock_store.get(collection, {})

        def _matches(document: Dict[str, Any]) -> bool:
            doc_value = document.get(field)
            if operator == "==":
                return doc_value == value
            if operator == "!=":
                return doc_value != value
            if operator == ">":
                return doc_value is not None and doc_value > value
            if operator == ">=":
                return doc_value is not None and doc_value >= value
            if operator == "<":
                return doc_value is not None and doc_value < value
            if operator == "<=":
                return doc_value is not None and doc_value <= value
            return False

        print(f"🔧 Mock[{self.mode}]: Querying {collection} where {field} {operator} {value}")
        return [
            deepcopy(document)
            for document in collection_store.values()
            if _matches(document)
        ]

# Global instance
firebase_service = FirebaseService()
