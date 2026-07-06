import os
import sys
from google.oauth2 import service_account
import google.auth.transport.requests

# Add backend directory to path
sys.path.append(os.path.abspath(os.path.dirname(__file__)))

def main():
    key_path = os.getenv("FIREBASE_SERVICE_ACCOUNT_KEY", "service-account-key.json")
    if not os.path.exists(key_path):
        # Fallback check relative to script
        key_path = os.path.join(os.path.dirname(__file__), key_path)

    if not os.path.exists(key_path):
        print(f"❌ Error: Service account key not found at {key_path}")
        return

    try:
        # Load credentials with the cloud-platform or datastore scope
        scopes = ['https://www.googleapis.com/auth/datastore']
        credentials = service_account.Credentials.from_service_account_file(key_path, scopes=scopes)
        
        # Refresh credentials to get the token
        request = google.auth.transport.requests.Request()
        credentials.refresh(request)
        
        print("\n=============================================")
        print("          YOUR ACCESS TOKEN FOR POSTMAN       ")
        print("=============================================")
        print(credentials.token)
        print("=============================================")
        print("💡 Copy the token above and use it in Postman under:")
        print("   Auth -> Type: Bearer Token")
        print("   (Note: This token is valid for 1 hour)\n")
    except Exception as e:
        print(f"❌ Failed to generate token: {e}")

if __name__ == '__main__':
    from dotenv import load_dotenv
    load_dotenv()
    main()
