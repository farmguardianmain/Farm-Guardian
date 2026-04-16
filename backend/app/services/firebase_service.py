import os
import json
from firebase_admin import credentials, firestore, initialize_app, get_app
from typing import Dict, List, Any, Optional

class FirebaseService:
    def __init__(self):
        self.db = None
        self._initialize_firebase()
    
    def _initialize_firebase(self):
        """Initialize Firebase with service account credentials"""
        try:
            # Option 1: Render-friendly raw JSON secret.
            cred_json = os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON")
            if cred_json:
                service_account_info = json.loads(cred_json)
                cred = credentials.Certificate(service_account_info)

                try:
                    get_app()
                except ValueError:
                    initialize_app(cred)

                self.db = firestore.client()
                print("✅ Firebase initialized successfully (FIREBASE_SERVICE_ACCOUNT_JSON)")
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
                print("✅ Firebase initialized successfully")
            else:
                print("⚠️  Firebase service account key not found. Using mock mode.")
                self.db = None
        except Exception as e:
            print(f"❌ Firebase initialization failed: {e}")
            self.db = None
    
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
        print(f"🔧 Mock: Creating {collection}/{doc_id}")
        return True
    
    async def _mock_get_document(self, collection: str, doc_id: str) -> Optional[Dict[str, Any]]:
        print(f"🔧 Mock: Getting {collection}/{doc_id}")
        return None
    
    async def _mock_update_document(self, collection: str, doc_id: str, data: Dict[str, Any]) -> bool:
        print(f"🔧 Mock: Updating {collection}/{doc_id}")
        return True
    
    async def _mock_delete_document(self, collection: str, doc_id: str) -> bool:
        print(f"🔧 Mock: Deleting {collection}/{doc_id}")
        return True
    
    async def _mock_get_collection(self, collection: str) -> List[Dict[str, Any]]:
        print(f"🔧 Mock: Getting collection {collection}")
        return []
    
    async def _mock_query_documents(self, collection: str, field: str, operator: str, value: Any) -> List[Dict[str, Any]]:
        print(f"🔧 Mock: Querying {collection} where {field} {operator} {value}")
        return []

# Global instance
firebase_service = FirebaseService()
