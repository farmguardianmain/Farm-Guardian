import sys
import os
import asyncio
from datetime import datetime

# Add backend directory to PYTHONPATH
sys.path.append(os.path.abspath(os.path.dirname(__file__)))

from app.services.firebase_service import firebase_service

async def main():
    print("\n=============================================")
    print("    FARM GUARDIANS DIRECT DATABASE WRITER    ")
    print("=============================================")
    print("This utility writes data directly to Firebase using your service-account-key.json.")
    print("Select what you want to add:")
    print("1) Add a new Cattle profile")
    print("2) Log a Milk Yield Record")
    print("3) Run a Custom Insert (write raw JSON)")
    
    choice = input("\nEnter choice (1-3): ").strip()
    
    if choice == '1':
        tag_id = input("Enter Tag ID (e.g., US-123456): ").strip()
        if not tag_id:
            print("Tag ID cannot be empty.")
            return
        name = input("Enter Name: ").strip()
        print("Available Breeds: holstein, jersey, brown_swiss, guernsey, ayrshire")
        breed = input("Enter Breed (default: holstein): ").strip().lower() or "holstein"
        if breed not in ["holstein", "jersey", "brown_swiss", "guernsey", "ayrshire"]:
            print(f"Invalid breed. Defaulting to 'holstein'.")
            breed = "holstein"
        try:
            weight = float(input("Enter Weight (kg, e.g. 520.5): ").strip())
        except ValueError:
            weight = 500.0
            print("Invalid weight. Defaulting to 500.0 kg.")
        notes = input("Enter Notes (optional): ").strip()
        
        # Build cattle document
        now = datetime.utcnow()
        status = "healthy"
        under_thresh = 450
        over_thresh = 900
        if weight < under_thresh:
            status = "underweight"
        elif weight > over_thresh:
            status = "overweight"

        cattle_data = {
            "tag_id": tag_id,
            "name": name,
            "breed": breed,
            "date_of_birth": now.isoformat() + "Z",
            "weight": weight,
            "status": status,
            "notes": notes,
            "created_at": now.isoformat() + "Z",
            "updated_at": now.isoformat() + "Z"
        }
        
        print(f"\nWriting to collection 'cattle' with document ID '{tag_id}'...")
        success = await firebase_service.create_document("cattle", tag_id, cattle_data)
        if success:
            print("✅ Successfully created cattle record in Firestore!")
        else:
            print("❌ Failed to create cattle record (please ensure Firebase key is active and correctly loaded).")
            
    elif choice == '2':
        cattle_id = input("Enter Cattle Tag ID: ").strip()
        if not cattle_id:
            print("Cattle Tag ID cannot be empty.")
            return
        try:
            yield_liters = float(input("Enter Milk Yield (liters, e.g. 12.5): ").strip())
        except ValueError:
            yield_liters = 10.0
            print("Invalid yield. Defaulting to 10.0 liters.")
        
        session = input("Enter session (morning/evening, default: morning): ").strip() or "morning"
        notes = input("Enter Notes (optional): ").strip()
        
        now = datetime.utcnow()
        timestamp_sec = int(now.timestamp())
        doc_id = f"milk_{cattle_id}_{timestamp_sec}"
        
        milk_record = {
            "id": doc_id,
            "cattle_id": cattle_id,
            "date": now.isoformat() + "Z",
            "session": session,
            "yield_liters": yield_liters,
            "notes": notes,
            "created_at": now.isoformat() + "Z"
        }
        
        print(f"\nWriting to collection 'milk_records' with document ID '{doc_id}'...")
        success = await firebase_service.create_document("milk_records", doc_id, milk_record)
        if success:
            print("✅ Successfully logged milk record in Firestore!")
        else:
            print("❌ Failed to log milk record.")
            
    elif choice == '3':
        collection = input("Enter Firestore collection name (e.g., alerts): ").strip()
        if not collection:
            print("Collection name cannot be empty.")
            return
        doc_id = input("Enter Document ID (or leave blank to autogenerate): ").strip()
        if not doc_id:
            import uuid
            doc_id = str(uuid.uuid4())
            print(f"Using generated UUID for Document ID: {doc_id}")
            
        print("Enter fields and values in JSON format (e.g. {\"title\": \"Health Warning\", \"severity\": \"warning\"}):")
        json_str = input("JSON data: ").strip()
        try:
            import json
            data = json.loads(json_str)
        except Exception as e:
            print(f"Invalid JSON format: {e}")
            return
            
        print(f"\nWriting to collection '{collection}' with document ID '{doc_id}'...")
        success = await firebase_service.create_document(collection, doc_id, data)
        if success:
            print("✅ Successfully wrote document to Firestore!")
        else:
            print("❌ Failed to write document.")
    else:
        print("Invalid choice.")

if __name__ == '__main__':
    from dotenv import load_dotenv
    load_dotenv()
    asyncio.run(main())
