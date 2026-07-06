import sys, os, asyncio

# Add backend to PYTHONPATH
sys.path.append(os.path.abspath('d:/ALL-CODE-HP/Farm Guardians/backend'))

from app.services.firebase_service import firebase_service

async def main():
    try:
        cattle = await firebase_service.get_collection('cattle')
        print('Cattle count:', len(cattle))
        # Show first 5 entries (if any)
        for doc in cattle[:5]:
            print(doc)
    except Exception as e:
        print('Error fetching cattle data:', e)

if __name__ == '__main__':
    asyncio.run(main())
