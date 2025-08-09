// 🔧 Configuration for PushSafer Testing

// Step 1: Update your Firebase project details
export const FIREBASE_CONFIG = {
  projectId: 'catcare-iot', // Your actual Firebase project ID
  region: 'us-central1' // Replace with your Firebase Functions region (us-central1, europe-west1, etc.)
}

// Step 2: Configure PushSafer (after setting up account)
export const PUSHSAFER_CONFIG = {
  privateKey: 'UVAdqzltoikVMpKEPuhh', // Your actual PushSafer private key
  deviceId: 'a' // 'a' = all devices, or specific device ID
}

// Step 3: EmailJS Configuration (already working)
export const EMAILJS_CONFIG = {
  serviceId: 'service_dd66tu5',
  templateId: 'template_p4qoknm', 
  publicKey: 'wDHGbOUSzglBM7ePp',
  privateKey: 'ppvt_lkV-495S0PeqtAFD'
}

// 🎯 How to configure for real testing:
// 
// 1. Replace 'your-firebase-project-id' with your actual Firebase project ID
// 2. Get PushSafer private key from https://www.pushsafer.com/
// 3. Update functions/index.js with your PushSafer key
// 4. Deploy: firebase deploy --only functions
// 5. Test with the dashboard buttons!

// 📱 Testing without Cloud Functions:
// - Email test: ✅ Works immediately  
// - PushSafer test: 🔄 Shows simulation mode
// - Complete test: ✅ Tests email + shows PushSafer simulation
// - Local test: ✅ Browser notifications

export default {
  FIREBASE_CONFIG,
  PUSHSAFER_CONFIG,
  EMAILJS_CONFIG
}
