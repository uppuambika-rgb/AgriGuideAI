const chatForm = document.querySelector('#chatForm');
const messageInput = document.querySelector('#messageInput');
const messages = document.querySelector('#messages');
const suggestions = document.querySelector('#suggestions');
const welcomeBlock = document.querySelector('#welcomeBlock');
const newChatButton = document.querySelector('#newChatButton');
const menuButton = document.querySelector('#menuButton');
const closeSidebar = document.querySelector('#closeSidebar');
const sidebar = document.querySelector('#sidebar');
const mobileOverlay = document.querySelector('#mobileOverlay');
const languageSelect = document.querySelector('#languageSelect');
const cameraInput = document.querySelector('#cameraInput');
const cameraButton = document.querySelector('#cameraButton');
const uploadInput = document.querySelector('#uploadInput');
const uploadButton = document.querySelector('#uploadButton');
const photoPreview = document.querySelector('#photoPreview');
const microphoneButton = document.querySelector('#microphoneButton');
const cameraBackdrop = document.querySelector('#cameraBackdrop');
const cameraVideo = document.querySelector('#cameraVideo');
const closeCamera = document.querySelector('#closeCamera');
const cancelCamera = document.querySelector('#cancelCamera');
const captureCamera = document.querySelector('#captureCamera');
const ideaRow = document.querySelector('#ideaRow');
const shuffleIdeas = document.querySelector('#shuffleIdeas');
const locationLabel = document.querySelector('#locationLabel');
const locationForm = document.querySelector('#locationForm');
const locationInput = document.querySelector('#locationInput');
const setLocationButton = document.querySelector('#setLocationButton');
const saveLocationButton = document.querySelector('#saveLocationButton');
const authBackdrop = document.querySelector('#authBackdrop');
const authForm = document.querySelector('#authForm');
const usernameInput = document.querySelector('#usernameInput');
const phoneInput = document.querySelector('#phoneInput');
const phoneLabel = document.querySelector('#phoneLabel');
const passwordInput = document.querySelector('#passwordInput');
const signInMode = document.querySelector('#signInMode');
const createAccountMode = document.querySelector('#createAccountMode');
const authTitle = document.querySelector('#authTitle');
const authCopy = document.querySelector('.auth-copy');
const authSubmit = document.querySelector('#authSubmit');
const authError = document.querySelector('#authError');
const forgotPasswordButton = document.querySelector('#forgotPasswordButton');
const forgotForm = document.querySelector('#forgotForm');
const forgotPhoneInput = document.querySelector('#forgotPhoneInput');
const otpStep = document.querySelector('#otpStep');
const otpInput = document.querySelector('#otpInput');
const otpDemo = document.querySelector('#otpDemo');
const verifyOtpButton = document.querySelector('#verifyOtpButton');
const backToSignin = document.querySelector('#backToSignin');
const profileButton = document.querySelector('#profileButton');
const signOutButton = document.querySelector('#signOutButton');
const profileName = document.querySelector('#profileName');
const profileEmail = document.querySelector('#profileEmail');
const chatHistory = document.querySelector('#chatHistory');
let selectedPhoto = null;
let recognition = null;
let cameraStream = null;
let currentUser = null;
let authMode = 'signin';
let currentLocation = localStorage.getItem('agriGuideLocation') || '';
let generatedOtp = '';
let otpExpiresAt = 0;

const ideaSets = [
  [
    { tag: 'Observe', title: 'What changed in my field this week?', prompt: 'Help me review what changes I should look for in my field this week.', color: 'sage' },
    { tag: 'Prepare', title: 'Make a 7-day crop plan', prompt: 'Help me make a simple 7-day plan for my crops.', color: 'sun' },
    { tag: 'Learn', title: 'Which helpful insects should I protect?', prompt: 'Which helpful insects should I protect in my farm?', color: 'clay' }
  ],
  [
    { tag: 'Save', title: 'Can I reduce water use?', prompt: 'How can I reduce water use without stressing my crops?', color: 'blue' },
    { tag: 'Notice', title: 'Read the story in my leaves', prompt: 'What can different leaf colors tell me about crop health?', color: 'sage' },
    { tag: 'Plan', title: 'What belongs in my field journal?', prompt: 'What should I record in a simple field journal?', color: 'sun' }
  ],
  [
    { tag: 'Restore', title: 'Give tired soil a fresh start', prompt: 'How can I improve tired soil before the next planting?', color: 'clay' },
    { tag: 'Protect', title: 'Build a natural pest plan', prompt: 'Help me create a natural pest prevention plan.', color: 'sage' },
    { tag: 'Explore', title: 'Find a crop for my conditions', prompt: 'Which crop could suit my climate, soil, and available water?', color: 'blue' }
  ]
];
let ideaSetIndex = 0;

function renderIdeas() {
  const localizedTitles = localizedIdeas[currentLanguage]?.[ideaSetIndex];
  ideaRow.innerHTML = ideaSets[ideaSetIndex].map((idea, index) => `
    <button class="idea-card ${idea.color}" type="button" data-prompt="${escapeHtml(idea.prompt)}">
      <span class="idea-tag">${localizedTitles ? localizedIdeaTags[currentLanguage][index] : idea.tag}</span><strong>${localizedTitles ? localizedTitles[index] : idea.title}</strong><span class="idea-arrow">↗</span>
    </button>`).join('');
  ideaRow.querySelectorAll('.idea-card').forEach((card) => card.addEventListener('click', () => submitMessage(card.dataset.prompt)));
}

function cycleIdeas() {
  ideaSetIndex = (ideaSetIndex + 1) % ideaSets.length;
  ideaRow.classList.remove('idea-refresh');
  void ideaRow.offsetWidth;
  ideaRow.classList.add('idea-refresh');
  renderIdeas();
}

const translations = {
  en: { kicker: 'Your field companion', title: 'Good morning, Samir.', welcome: 'What are we growing through today?', promptLabel: 'Try asking', placeholder: 'Ask anything about your field...', photo: 'Add a photo for plant diagnosis', disclaimer: 'AgriGuide can make mistakes. Check important decisions with a local agriculture expert.', intro: 'I’m here to help you make sense of what’s happening in your field. Ask me about crops, soil, pests, or planning.', replies: ['Start with the crop, your soil type, and the last time it rained. Share those details and I can help you make a practical plan.', 'A clear photo of the whole plant and a close-up of the affected leaves would help narrow down the cause.', 'Check soil moisture about 5 cm below the surface before watering. Consistent, deep watering is usually better than frequent shallow watering.'] },
  hi: { kicker: 'आपका खेत साथी', title: 'सुप्रभात, समीर।', welcome: 'आज हम क्या उगाने वाले हैं?', promptLabel: 'यह पूछकर देखें', placeholder: 'अपने खेत के बारे में कुछ भी पूछें...', photo: 'पौधे की जांच के लिए फोटो जोड़ें', thinking: 'सोच रहा हूँ...', disclaimer: 'AgriGuide से गलती हो सकती है। महत्वपूर्ण निर्णयों के लिए स्थानीय कृषि विशेषज्ञ से सलाह लें।', intro: 'आपके खेत में क्या हो रहा है, इसे समझने में मैं आपकी मदद करूंगा। फसल, मिट्टी, कीट या योजना के बारे में पूछें।', replies: ['फसल, मिट्टी के प्रकार और पिछली बारिश की जानकारी से शुरुआत करें। ये विवरण साझा करें, मैं व्यावहारिक योजना बनाने में मदद करूंगा।', 'पूरे पौधे और प्रभावित पत्तियों की स्पष्ट फोटो से समस्या का कारण समझने में मदद मिलेगी।', 'पानी देने से पहले मिट्टी की नमी लगभग 5 सेमी नीचे जांचें। बार-बार कम पानी देने से बेहतर है गहराई से और नियमित पानी देना।'] },
  te: { kicker: 'మీ పొలం సహచరుడు', title: 'శుభోదయం, సమీర్.', welcome: 'ఈ రోజు మనం ఏమి పండిద్దాం?', promptLabel: 'ఇలా అడగండి', placeholder: 'మీ పొలం గురించి ఏదైనా అడగండి...', photo: 'మొక్కను పరిశీలించడానికి ఫోటో జోడించండి', thinking: 'ఆలోచిస్తున్నాను...', disclaimer: 'AgriGuide తప్పులు చేయవచ్చు. ముఖ్యమైన నిర్ణయాలకు స్థానిక వ్యవసాయ నిపుణుడిని సంప్రదించండి.', intro: 'మీ పొలంలో ఏమి జరుగుతుందో అర్థం చేసుకోవడంలో నేను సహాయం చేస్తాను. పంటలు, నేల, పురుగులు లేదా ప్రణాళిక గురించి అడగండి.', replies: ['పంట, నేల రకం మరియు చివరిసారి వర్షం పడిన సమయం గురించి చెప్పండి. ఆ వివరాలతో ఆచరణాత్మక ప్రణాళికను సూచిస్తాను.', 'మొక్క మొత్తం మరియు ప్రభావిత ఆకుల స్పష్టమైన ఫోటో కారణాన్ని గుర్తించడంలో సహాయపడుతుంది.', 'నీరు పెట్టే ముందు నేల తేమను 5 సెం.మీ. లోతులో చూడండి. తరచుగా కొద్దిగా నీరు పెట్టడం కంటే క్రమంగా లోతుగా నీరు పెట్టడం మంచిది.'] },
  ta: { kicker: 'உங்கள் வயல் துணை', title: 'காலை வணக்கம், சமீர்.', welcome: 'இன்று நாம் என்ன பயிரிடலாம்?', promptLabel: 'இதை கேளுங்கள்', placeholder: 'உங்கள் வயலைப் பற்றி எதையும் கேளுங்கள்...', photo: 'தாவரத்தை ஆய்வு செய்ய புகைப்படம் சேர்க்கவும்', disclaimer: 'AgriGuide தவறு செய்யலாம். முக்கிய முடிவுகளுக்கு உள்ளூர் வேளாண் நிபுணரை அணுகவும்.', intro: 'உங்கள் வயலில் நடப்பதைப் புரிந்துகொள்ள நான் உதவுகிறேன். பயிர்கள், மண், பூச்சிகள் அல்லது திட்டமிடல் பற்றி கேளுங்கள்.', replies: ['பயிர், மண் வகை மற்றும் கடைசியாக மழை பெய்த நேரத்தைப் பகிருங்கள். நடைமுறைத் திட்டத்தை உருவாக்க உதவுகிறேன்.', 'முழுத் தாவரம் மற்றும் பாதிக்கப்பட்ட இலைகளின் தெளிவான புகைப்படம் காரணத்தைக் கண்டறிய உதவும்.', 'நீர் ஊற்றுவதற்கு முன் 5 செ.மீ. ஆழத்தில் மண் ஈரப்பதத்தைச் சரிபார்க்கவும்.'] },
  kn: { kicker: 'ನಿಮ್ಮ ಹೊಲದ ಸಹಚರ', title: 'ಶುಭೋದಯ, ಸಮೀರ್.', welcome: 'ಇಂದು ನಾವು ಏನು ಬೆಳೆಯೋಣ?', promptLabel: 'ಇದನ್ನು ಕೇಳಿ', placeholder: 'ನಿಮ್ಮ ಹೊಲದ ಬಗ್ಗೆ ಏನನ್ನಾದರೂ ಕೇಳಿ...', photo: 'ಸಸ್ಯ ಪರಿಶೀಲನೆಗಾಗಿ ಫೋಟೋ ಸೇರಿಸಿ', disclaimer: 'AgriGuide ತಪ್ಪುಗಳನ್ನು ಮಾಡಬಹುದು. ಪ್ರಮುಖ ನಿರ್ಧಾರಗಳಿಗಾಗಿ ಸ್ಥಳೀಯ ಕೃಷಿ ತಜ್ಞರನ್ನು ಸಂಪರ್ಕಿಸಿ.', intro: 'ನಿಮ್ಮ ಹೊಲದಲ್ಲಿ ಏನಾಗುತ್ತಿದೆ ಎಂಬುದನ್ನು ಅರ್ಥಮಾಡಿಕೊಳ್ಳಲು ನಾನು ಸಹಾಯ ಮಾಡುತ್ತೇನೆ. ಬೆಳೆ, ಮಣ್ಣು, ಕೀಟಗಳು ಅಥವಾ ಯೋಜನೆ ಬಗ್ಗೆ ಕೇಳಿ.', replies: ['ಬೆಳೆ, ಮಣ್ಣಿನ ಪ್ರಕಾರ ಮತ್ತು ಕೊನೆಯ ಬಾರಿ ಮಳೆ ಬಂದ ಸಮಯವನ್ನು ಹಂಚಿಕೊಳ್ಳಿ. ಪ್ರಾಯೋಗಿಕ ಯೋಜನೆ ಮಾಡಲು ಸಹಾಯ ಮಾಡುತ್ತೇನೆ.', 'ಇಡೀ ಸಸ್ಯ ಮತ್ತು ಬಾಧಿತ ಎಲೆಗಳ ಸ್ಪಷ್ಟ ಫೋಟೋ ಕಾರಣವನ್ನು ಕಂಡುಹಿಡಿಯಲು ಸಹಾಯ ಮಾಡುತ್ತದೆ.', 'ನೀರು ಹಾಕುವ ಮೊದಲು 5 ಸೆಂ.ಮೀ. ಆಳದಲ್ಲಿ ಮಣ್ಣಿನ ತೇವಾಂಶ ಪರಿಶೀಲಿಸಿ.'] }
};
let currentLanguage = localStorage.getItem('agriGuideLanguage') || 'en';
const greetingTemplates = {
  en: 'Good morning, {username}.',
  hi: 'सुप्रभात, {username}।',
  te: 'శుభోదయం, {username}.',
  ta: 'காலை வணக்கம், {username}.',
  kn: 'ಶುಭೋದಯ, {username}.',
};
const interfaceTranslations = {
  en: { pulse: 'Field pulse', locationUnset: 'Location not set', setLocation: 'Set location', changeLocation: 'Change', currentWeather: 'Current weather', humidity: 'Humidity', garden: 'Idea garden', gardenHint: 'Small questions can grow into better harvests.', shuffle: 'Shuffle', photoHint: 'Add a photo for plant diagnosis (optional)' },
  hi: { pulse: 'खेत की स्थिति', locationUnset: 'स्थान सेट नहीं है', setLocation: 'स्थान सेट करें', changeLocation: 'बदलें', currentWeather: 'वर्तमान मौसम', humidity: 'नमी', garden: 'विचार बगीचा', gardenHint: 'छोटे सवाल बेहतर फसल में मदद कर सकते हैं।', shuffle: 'बदलें', photoHint: 'पौधे की जांच के लिए फोटो जोड़ें (वैकल्पिक)' },
  te: { pulse: 'పొలం పరిస్థితి', locationUnset: 'స్థానం సెట్ కాలేదు', setLocation: 'స్థానం సెట్ చేయండి', changeLocation: 'మార్చండి', currentWeather: 'ప్రస్తుత వాతావరణం', humidity: 'తేమ', garden: 'ఆలోచనల తోట', gardenHint: 'చిన్న ప్రశ్నలు మంచి పంటకు దారి తీస్తాయి.', shuffle: 'మార్చండి', photoHint: 'మొక్కను పరిశీలించడానికి ఫోటో జోడించండి (ఐచ్ఛికం)' },
  ta: { pulse: 'வயல் நிலை', locationUnset: 'இடம் அமைக்கப்படவில்லை', setLocation: 'இடத்தை அமைக்கவும்', changeLocation: 'மாற்று', currentWeather: 'தற்போதைய வானிலை', humidity: 'ஈரப்பதம்', garden: 'யோசனைத் தோட்டம்', gardenHint: 'சிறிய கேள்விகள் சிறந்த அறுவடைக்கு உதவும்.', shuffle: 'மாற்று', photoHint: 'தாவரத்தை ஆய்வு செய்ய புகைப்படம் சேர்க்கவும் (விருப்பம்)' },
  kn: { pulse: 'ಹೊಲದ ಸ್ಥಿತಿ', locationUnset: 'ಸ್ಥಳ ಹೊಂದಿಸಿಲ್ಲ', setLocation: 'ಸ್ಥಳ ಹೊಂದಿಸಿ', changeLocation: 'ಬದಲಿಸಿ', currentWeather: 'ಪ್ರಸ್ತುತ ಹವಾಮಾನ', humidity: 'ತೇವಾಂಶ', garden: 'ಆಲೋಚನೆ ತೋಟ', gardenHint: 'ಸಣ್ಣ ಪ್ರಶ್ನೆಗಳು ಉತ್ತಮ ಬೆಳೆಗೆ ಸಹಾಯ ಮಾಡುತ್ತವೆ.', shuffle: 'ಬದಲಿಸಿ', photoHint: 'ಸಸ್ಯ ಪರಿಶೀಲನೆಗಾಗಿ ಫೋಟೋ ಸೇರಿಸಿ (ಐಚ್ಛಿಕ)' }
};
const localizedIdeas = {
  hi: [['इस सप्ताह खेत में क्या बदला?', '7-दिन की फसल योजना बनाएं', 'कौन से लाभकारी कीट बचाएं?'], ['क्या मैं पानी बचा सकता हूँ?', 'पत्तियां क्या बता रही हैं?', 'फील्ड जर्नल में क्या लिखें?'], ['थकी मिट्टी को नई शुरुआत दें', 'प्राकृतिक कीट योजना बनाएं', 'मेरी स्थिति के लिए सही फसल खोजें']],
  te: [['ఈ వారం పొలంలో ఏమి మారింది?', '7 రోజుల పంట ప్రణాళిక చేయండి', 'ఏ ఉపయోగకరమైన కీటకాలను కాపాడాలి?'], ['నీటిని తగ్గించవచ్చా?', 'ఆకులు ఏమి చెబుతున్నాయి?', 'పొలం డైరీలో ఏమి రాయాలి?'], ['అలసిన నేలకు కొత్త ప్రారంభం', 'సహజ పురుగు నియంత్రణ ప్రణాళిక', 'నా పరిస్థితికి సరైన పంటను ఎంచుకోండి']],
  ta: [['இந்த வாரம் வயலில் என்ன மாறியது?', '7 நாள் பயிர் திட்டம்', 'எந்த நன்மை தரும் பூச்சிகளை காப்பது?'], ['நீர் பயன்பாட்டை குறைக்கலாமா?', 'இலைகள் என்ன சொல்கின்றன?', 'வயல் குறிப்பேட்டில் என்ன எழுதலாம்?'], ['சோர்ந்த மண்ணுக்கு புதிய தொடக்கம்', 'இயற்கை பூச்சி தடுப்பு திட்டம்', 'என் நிலைக்கு ஏற்ற பயிரை தேர்வு செய்யவும்']],
  kn: [['ಈ ವಾರ ಹೊಲದಲ್ಲಿ ಏನು ಬದಲಾಯಿತು?', '7 ದಿನಗಳ ಬೆಳೆ ಯೋಜನೆ', 'ಯಾವ ಉಪಕಾರಿ ಕೀಟಗಳನ್ನು ರಕ್ಷಿಸಬೇಕು?'], ['ನೀರಿನ ಬಳಕೆ ಕಡಿಮೆ ಮಾಡಬಹುದೇ?', 'ಎಲೆಗಳು ಏನು ಹೇಳುತ್ತವೆ?', 'ಹೊಲದ ದಿನಚರಿಯಲ್ಲಿ ಏನು ಬರೆಯಬೇಕು?'], ['ದಣಿದ ಮಣ್ಣಿಗೆ ಹೊಸ ಆರಂಭ', 'ನೈಸರ್ಗಿಕ ಕೀಟ ತಡೆ ಯೋಜನೆ', 'ನನ್ನ ಪರಿಸ್ಥಿತಿಗೆ ಸೂಕ್ತ ಬೆಳೆ ಆಯ್ಕೆ ಮಾಡಿ']]
};
const localizedIdeaTags = {
  hi: ['देखें', 'योजना', 'सीखें'],
  te: ['గమనించండి', 'ప్రణాళిక', 'నేర్చుకోండి'],
  ta: ['கவனிக்கவும்', 'திட்டமிடவும்', 'கற்றுக்கொள்ளவும்'],
  kn: ['ಗಮನಿಸಿ', 'ಯೋಜಿಸಿ', 'ಕಲಿಯಿರಿ']
};
const localizedSuggestions = {
  en: ['What should I plant this month?', 'How can I improve my soil health?', 'Help me identify a pest on my crop', 'How much water do my crops need?'],
  hi: ['इस महीने क्या लगाएं?', 'मिट्टी का स्वास्थ्य कैसे सुधारें?', 'फसल के कीट पहचानने में मदद करें', 'फसलों को कितना पानी दें?'],
  te: ['ఈ నెల ఏమి నాటాలి?', 'నేల ఆరోగ్యాన్ని ఎలా మెరుగుపరచాలి?', 'పంటపై పురుగును గుర్తించండి', 'పంటలకు ఎంత నీరు ఇవ్వాలి?'],
  ta: ['இந்த மாதம் என்ன பயிரிடலாம்?', 'மண் ஆரோக்கியத்தை எப்படி மேம்படுத்தலாம்?', 'பயிர் பூச்சியை கண்டறிய உதவுங்கள்', 'பயிர்களுக்கு எவ்வளவு நீர் தேவை?'],
  kn: ['ಈ ತಿಂಗಳು ಏನು ನೆಡಬೇಕು?', 'ಮಣ್ಣಿನ ಆರೋಗ್ಯವನ್ನು ಹೇಗೆ ಸುಧಾರಿಸುವುದು?', 'ಬೆಳೆ ಕೀಟವನ್ನು ಗುರುತಿಸಲು ಸಹಾಯ ಮಾಡಿ', 'ಬೆಳೆಗಳಿಗೆ ಎಷ್ಟು ನೀರು ಬೇಕು?']
};

function escapeHtml(text) {
  return text.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[character]));
}

function questionsKey() {
  return `agriGuideQuestions:${(currentUser.email || currentUser.phone).toLowerCase()}`;
}

function getSavedQuestions() {
  return currentUser ? JSON.parse(localStorage.getItem(questionsKey()) || '[]') : [];
}

function renderQuestionHistory() {
  const savedQuestions = getSavedQuestions();
  const items = savedQuestions.slice(-6).reverse();
  chatHistory.innerHTML = '<p class="nav-label">Recent questions</p>';
  if (!items.length) {
    chatHistory.insertAdjacentHTML('beforeend', '<p class="empty-history">Your questions will appear here.</p>');
    return;
  }
  items.forEach((question) => {
    const button = document.createElement('button');
    button.className = 'history-item';
    button.type = 'button';
    button.innerHTML = `<span class="history-dot muted"></span><span>${escapeHtml(question.text)}</span>`;
    button.addEventListener('click', () => {
      messageInput.value = question.text;
      messageInput.focus();
    });
    chatHistory.appendChild(button);
  });
}

function saveQuestion(text) {
  if (!currentUser) return;
  const questions = getSavedQuestions();
  questions.push({ text, hasPhoto: Boolean(selectedPhoto), createdAt: new Date().toISOString() });
  localStorage.setItem(questionsKey(), JSON.stringify(questions.slice(-20)));
  renderQuestionHistory();
}

function updateProfile() {
  if (!currentUser) return;
  const username = currentUser.username || currentUser.name;
  profileName.textContent = username;
  profileEmail.textContent = currentUser.phone || currentUser.email || 'Grower account';
  document.querySelector('.avatar').textContent = username.slice(0, 2).toUpperCase();
}

function updateLocationLabel() {
  locationLabel.textContent = currentLocation || 'Location not set';
  setLocationButton.textContent = currentLocation ? 'Change' : 'Set location';
  locationForm.hidden = Boolean(currentLocation);
}

async function loadWeather(location) {
  const weatherCondition = document.querySelector('#weatherCondition');
  const weatherTemperature = document.querySelector('#weatherTemperature');
  const weatherHumidity = document.querySelector('#weatherHumidity');
  const weatherHumidityLabel = document.querySelector('#weatherHumidityLabel');
  weatherCondition.textContent = 'Loading weather';
  weatherTemperature.textContent = '--';
  weatherHumidity.textContent = '--';
  weatherHumidityLabel.textContent = 'Fetching current data';
  try {
    const response = await fetch(`/api/weather?location=${encodeURIComponent(location)}`);
    const data = await response.json();
    if (!data.weather?.available) {
      weatherCondition.textContent = 'Weather unavailable';
      weatherHumidityLabel.textContent = data.weather?.message || 'Try another location';
      return;
    }
    const weather = data.weather;
    weatherCondition.textContent = weather.condition || 'Weather available';
    weatherTemperature.textContent = weather.temperature_c !== null && weather.temperature_c !== undefined ? `${Math.round(weather.temperature_c)}°` : '--';
    weatherHumidity.textContent = weather.humidity !== null && weather.humidity !== undefined ? `${Math.round(weather.humidity)}%` : '--';
    weatherHumidityLabel.textContent = weather.precipitation_probability !== null && weather.precipitation_probability !== undefined ? `${Math.round(weather.precipitation_probability)}% rain chance` : 'Current humidity';
  } catch (error) {
    weatherCondition.textContent = 'Weather unavailable';
    weatherHumidityLabel.textContent = 'Check your connection';
  }
}

setLocationButton.addEventListener('click', () => {
  locationForm.hidden = false;
  locationInput.value = currentLocation;
  locationInput.focus();
});

function saveLocation() {
  const location = locationInput.value.trim();
  if (!location) return;
  currentLocation = location;
  localStorage.setItem('agriGuideLocation', currentLocation);
  updateLocationLabel();
  loadWeather(currentLocation);
}

locationForm.addEventListener('submit', (event) => {
  event.preventDefault();
  saveLocation();
});

saveLocationButton.addEventListener('click', saveLocation);

locationInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    event.preventDefault();
    saveLocation();
  }
});

function showLogin() {
  authBackdrop.hidden = false;
  authForm.hidden = false;
  forgotForm.hidden = true;
  forgotPasswordButton.hidden = false;
  setAuthMode('signin');
  window.setTimeout(() => usernameInput.focus(), 0);
}

function accountForPhone(phone) {
  const digits = phone.replace(/\D/g, '');
  return JSON.parse(localStorage.getItem(`agriGuideAccount:${digits}`) || 'null');
}

forgotPasswordButton.addEventListener('click', () => {
  authError.textContent = 'Password reset is not configured yet. Contact the administrator.';
  authError.hidden = false;
});

forgotForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const account = accountForPhone(forgotPhoneInput.value.trim());
  if (!account) {
    authError.textContent = 'No account found for this phone number.';
    authError.hidden = false;
    return;
  }
  generatedOtp = String(Math.floor(100000 + Math.random() * 900000));
  otpExpiresAt = Date.now() + 5 * 60 * 1000;
  otpStep.hidden = false;
  otpDemo.textContent = `Demo OTP: ${generatedOtp}. In production, this code must be sent by SMS.`;
  otpDemo.hidden = false;
  authError.hidden = true;
  otpInput.value = '';
  otpInput.focus();
});

verifyOtpButton.addEventListener('click', () => {
  if (Date.now() > otpExpiresAt) {
    authError.textContent = 'This OTP has expired. Request a new one.';
    authError.hidden = false;
    return;
  }
  if (otpInput.value.trim() !== generatedOtp) {
    authError.textContent = 'Incorrect OTP. Please try again.';
    authError.hidden = false;
    return;
  }
  const account = accountForPhone(forgotPhoneInput.value.trim());
  currentUser = { username: account.username, phone: account.phone };
  localStorage.setItem('agriGuideUser', JSON.stringify(currentUser));
  generatedOtp = '';
  authBackdrop.hidden = true;
  updateProfile();
  updateLanguage();
  renderQuestionHistory();
  messageInput.focus();
});

backToSignin.addEventListener('click', showLogin);

function setAuthMode(mode) {
  authMode = mode;
  const creating = mode === 'create';
  signInMode.classList.toggle('active', !creating);
  createAccountMode.classList.toggle('active', creating);
  signInMode.setAttribute('aria-selected', String(!creating));
  createAccountMode.setAttribute('aria-selected', String(creating));
  authTitle.textContent = creating ? 'Create your field account' : 'Welcome back';
  authCopy.textContent = creating ? 'Use your phone number to create an account and keep your field notes close.' : 'Sign in with your username and password to continue.';
  phoneLabel.hidden = !creating;
  phoneInput.hidden = !creating;
  phoneInput.required = creating;
  authSubmit.firstChild.textContent = creating ? 'Create account ' : 'Sign in ';
  authError.hidden = true;
}

signInMode.addEventListener('click', () => setAuthMode('signin'));
createAccountMode.addEventListener('click', () => setAuthMode('create'));

authForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const username = usernameInput.value.trim();
  const phone = phoneInput.value.trim();
  try {
    const response = await fetch(`/api/auth/${authMode === 'create' ? 'register' : 'login'}`, {
      method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(authMode === 'create' ? { username, phone, password: passwordInput.value } : { username, password: passwordInput.value })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Unable to sign in.');
    currentUser = data.user;
  } catch (error) {
    authError.textContent = error.message || 'Unable to sign in.';
    authError.hidden = false;
    return;
  }
  authBackdrop.hidden = true;
  updateProfile();
  updateLanguage();
  renderQuestionHistory();
  messageInput.focus();
});

signOutButton.addEventListener('click', async () => {
  await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' });
  currentUser = null;
  showLogin();
});

function updateLanguage() {
  const copy = translations[currentLanguage];
  const ui = interfaceTranslations[currentLanguage] || interfaceTranslations.en;
  const username = currentUser?.username || currentUser?.name || 'Farmer';
  document.querySelector('.welcome-kicker').lastChild.textContent = ` ${copy.kicker}`;
  document.querySelector('.welcome-block h1').textContent = (greetingTemplates[currentLanguage] || greetingTemplates.en).replace('{username}', username);
  document.querySelector('.welcome-block p').textContent = copy.welcome;
  document.querySelector('.suggestions-label').textContent = copy.promptLabel;
  messageInput.placeholder = copy.placeholder;
  document.querySelector('.composer-hint').textContent = `${copy.photo} (optional)`;
  document.querySelector('.disclaimer').textContent = copy.disclaimer;
  document.querySelector('.intro-message .message-bubble p').textContent = copy.intro;
  document.documentElement.lang = currentLanguage;
  localStorage.setItem('agriGuideLanguage', currentLanguage);
  document.querySelector('.pulse-heading > span').textContent = ui.pulse;
  locationLabel.textContent = currentLocation || ui.locationUnset;
  setLocationButton.textContent = currentLocation ? ui.changeLocation : ui.setLocation;
  document.querySelector('.weather-icon').nextElementSibling.querySelector('small').textContent = ui.currentWeather;
  document.querySelector('.soil-icon').nextElementSibling.querySelector('small').textContent = ui.humidity;
  document.querySelector('.garden-heading > div > span:nth-child(2)').textContent = ui.garden;
  document.querySelector('.garden-heading small').textContent = ui.gardenHint;
  document.querySelector('#shuffleIdeas').firstChild.textContent = `${ui.shuffle} `;
  document.querySelector('.composer-hint').textContent = ui.photoHint;
  const suggestionLabels = localizedSuggestions[currentLanguage];
  document.querySelectorAll('.suggestion-chip').forEach((chip, index) => { chip.lastChild.textContent = ` ${suggestionLabels?.[index] || localizedSuggestions.en[index]}`; });
}

function addMessage(text, type) {
  const messageData = typeof text === 'string' ? { text } : text;
  const message = document.createElement('article');
  message.className = `message ${type}-message`;
  const initials = type === 'user' ? 'SK' : 'AG';
  const label = type === 'user' ? 'You' : 'AgriGuide';
  message.innerHTML = `
    <div class="message-avatar ${type === 'user' ? 'user-avatar' : 'assistant-avatar'}">${initials}</div>
    <div class="message-content">
      <div class="message-meta"><strong>${label}</strong><time>Just now</time></div>
      <div class="message-bubble"><p>${escapeHtml(String(messageData.text || ''))}</p>${messageData.imageUrl ? `<img class="uploaded-chat-image" src="${messageData.imageUrl}" alt="Uploaded crop photo" />` : ''}</div>
    </div>`;
  messages.appendChild(message);
  message.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function addLoadingMessage() {
  const loading = document.createElement('article');
  loading.className = 'message assistant-message loading-message';
  const thinking = translations[currentLanguage].thinking || 'Thinking...';
  loading.innerHTML = `<div class="message-avatar assistant-avatar">AG</div><div class="message-content"><div class="message-meta"><strong>AgriGuide</strong><time>${thinking}</time></div><div class="message-bubble"><p>···</p></div></div>`;
  messages.appendChild(loading);
  loading.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  return loading;
}

function getVisualForQuestion(question) {
  if (/pest|insect|bug|aphid|worm|कीट/.test(question)) return { image: 'sample-pest.svg', caption: 'Illustrative reference: leaf pest signs' };
  if (/leaf|leaves|spot|yellow|curl|tomato|टमाटर/.test(question)) return { image: 'sample-tomato.svg', caption: 'Illustrative reference: affected leaves' };
  if (/soil|fertil|compost|manure|water|irrigat|dry|thirst|मिट्टी|पानी/.test(question)) return { image: 'sample-soil.svg', caption: 'Illustrative reference: soil and moisture' };
  if (/plant|seed|sow|grow|crop|maize|corn|rice|wheat|millet|धान|गेहूं|फसल|पौध/.test(question)) return { image: 'sample-crop.svg', caption: 'Illustrative reference: crop field' };
  if (/picture|photo|image|visual|look like|show me|चित्र|फोटो|तस्वीर/.test(question)) return { image: 'sample-crop.svg', caption: 'Illustrative reference: crop field' };
  return null;
}

function getReply(question) {
  const lowerQuestion = question.toLowerCase();
  const copy = translations[currentLanguage];
  const reply = (text) => ({ text });
  if (currentLanguage !== 'en') return reply(copy.replies[Math.floor(Math.random() * copy.replies.length)]);
  if (/pest|insect|bug|aphid|worm|कीट/.test(lowerQuestion)) {
    return reply('For pest problems, check the underside of leaves and look for eggs, sticky residue, or bite marks. A photo is helpful but optional. Tell me the crop and what you can see, and I will suggest the next step.');
  }
  if (/spot|leaf|leaves|tomato|yellow|curl/.test(lowerQuestion)) {
    return reply('Leaf spots can come from fungal disease, watering stress, or pests. Check whether the spots are spreading, whether the underside has insects, and keep water off the leaves. The reference image shows the kind of detail to inspect.');
  }
  if (/water|irrigat|dry|thirst|पानी/.test(lowerQuestion)) {
    return reply('Check the soil about 5 cm below the surface before watering. Water slowly at the root zone when it feels dry, and avoid keeping the soil constantly soaked.');
  }
  if (/soil|fertil|compost|manure|मिट्टी/.test(lowerQuestion)) {
    return reply('For healthier soil, add mature compost, keep the surface covered with mulch, and avoid working wet soil. Knowing your crop and soil type will help me tailor the advice.');
  }
  if (/plant|seed|sow|grow|crop|पौध|फसल/.test(lowerQuestion)) {
    return reply('I can help plan that. Share your location, season, available water, and the crop you are considering.');
  }
  if (/weather|rain|तापमान|बारिश/.test(lowerQuestion)) {
    return reply('Weather can change the right field action. Tell me your location and crop, then I can help you decide whether to water, spray, plant, or wait.');
  }
  return reply('I can help you work through that. Share the crop or farm situation, what you have noticed, and what outcome you want. A photo is optional and only needed when visual details matter.');
}

async function submitMessage(text) {
  const cleanText = text.trim();
  if (!cleanText && !selectedPhoto) return;
  const photo = selectedPhoto;
  const question = cleanText || 'Please analyze this crop image.';
  saveQuestion(question);
  addMessage({ text: question, imageUrl: photo ? URL.createObjectURL(photo) : null }, 'user');
  messageInput.value = '';
  messageInput.style.height = 'auto';
  welcomeBlock.hidden = true;
  suggestions.hidden = true;

  clearSelectedPhoto();
  const loading = addLoadingMessage();
  try {
    let response;
    if (photo) {
      const form = new FormData();
      form.append('image', photo);
      form.append('question', question);
      form.append('location', currentLocation);
      form.append('language', currentLanguage);
      response = await fetch('/api/image/analyze', { method: 'POST', credentials: 'same-origin', body: form });
    } else {
      response = await fetch('/api/advice', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question, location: currentLocation, language: currentLanguage }) });
    }
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'The server could not complete that request.');
    const answer = photo ? data.analysis : data.answer;
    const caption = photo ? data.observations?.[0] : '';
    const summary = answer?.summary || answer?.what_may_be_happening || 'Advice is available, but no summary was returned.';
    addMessage([caption, summary].filter(Boolean).join('\n\n'), 'assistant');
  } catch (error) {
    addMessage(error.message || 'Unable to get advice right now. Please try again.', 'assistant');
  } finally {
    loading.remove();
  }
}

shuffleIdeas.addEventListener('click', cycleIdeas);

async function stopCamera() {
  if (cameraStream) cameraStream.getTracks().forEach((track) => track.stop());
  cameraStream = null;
  cameraVideo.srcObject = null;
  cameraBackdrop.hidden = true;
}

async function openCamera() {
  if (!navigator.mediaDevices?.getUserMedia) {
    cameraInput.click();
    return;
  }
  try {
    cameraStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
    cameraVideo.srcObject = cameraStream;
    cameraBackdrop.hidden = false;
  } catch (error) {
    cameraInput.click();
  }
}

cameraButton.addEventListener('click', openCamera);
uploadButton.addEventListener('click', () => uploadInput.click());
closeCamera.addEventListener('click', stopCamera);
cancelCamera.addEventListener('click', stopCamera);

captureCamera.addEventListener('click', () => {
  if (!cameraStream) return;
  const canvas = document.createElement('canvas');
  canvas.width = cameraVideo.videoWidth;
  canvas.height = cameraVideo.videoHeight;
  canvas.getContext('2d').drawImage(cameraVideo, 0, 0);
  canvas.toBlob((blob) => {
    selectedPhoto = new File([blob], 'agriguide-camera-photo.jpg', { type: 'image/jpeg' });
    showPhotoPreview();
    stopCamera();
  }, 'image/jpeg', .9);
});

cameraInput.addEventListener('change', () => {
  const [file] = cameraInput.files;
  if (!file) return;
  selectedPhoto = file;
  showPhotoPreview();
});

uploadInput.addEventListener('change', () => {
  const [file] = uploadInput.files;
  if (!file) return;
  selectedPhoto = file;
  showPhotoPreview();
});

function showPhotoPreview() {
  if (!selectedPhoto) return;
  if (photoPreview.dataset.url) URL.revokeObjectURL(photoPreview.dataset.url);
  const imageUrl = URL.createObjectURL(selectedPhoto);
  photoPreview.dataset.url = imageUrl;
  photoPreview.innerHTML = `<img src="${imageUrl}" alt="Selected crop photo" /><button type="button" aria-label="Remove selected photo">×</button>`;
  photoPreview.hidden = false;
  photoPreview.querySelector('button').addEventListener('click', clearSelectedPhoto);
}

function clearSelectedPhoto() {
  if (photoPreview.dataset.url) URL.revokeObjectURL(photoPreview.dataset.url);
  selectedPhoto = null;
  cameraInput.value = '';
  uploadInput.value = '';
  photoPreview.dataset.url = '';
  photoPreview.innerHTML = '';
  photoPreview.hidden = true;
}

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
if (SpeechRecognition) {
  recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.lang = currentLanguage;
  recognition.addEventListener('result', (event) => {
    messageInput.value = Array.from(event.results).map((result) => result[0].transcript).join('');
    messageInput.dispatchEvent(new Event('input'));
  });
  recognition.addEventListener('start', () => {
    microphoneButton.classList.add('listening');
    microphoneButton.setAttribute('aria-label', 'Stop voice input');
  });
  recognition.addEventListener('end', () => {
    microphoneButton.classList.remove('listening');
    microphoneButton.setAttribute('aria-label', 'Start voice input');
  });
  recognition.addEventListener('error', () => {
    microphoneButton.classList.remove('listening');
  });
  microphoneButton.addEventListener('click', () => {
    if (microphoneButton.classList.contains('listening')) recognition.stop();
    else {
      recognition.lang = currentLanguage;
      recognition.start();
    }
  });
} else {
  microphoneButton.title = 'Voice input is not supported in this browser';
  microphoneButton.addEventListener('click', () => {
    messageInput.placeholder = 'Voice input is not supported in this browser';
    window.setTimeout(() => { messageInput.placeholder = translations[currentLanguage].placeholder; }, 2200);
  });
}

chatForm.addEventListener('submit', (event) => {
  event.preventDefault();
  submitMessage(messageInput.value);
});

document.querySelectorAll('.suggestion-chip').forEach((chip) => {
  chip.addEventListener('click', () => submitMessage(chip.dataset.prompt));
});

messageInput.addEventListener('input', () => {
  messageInput.style.height = 'auto';
  messageInput.style.height = `${Math.min(messageInput.scrollHeight, 120)}px`;
});

messageInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    chatForm.requestSubmit();
  }
});

function toggleSidebar(isOpen) {
  sidebar.classList.toggle('open', isOpen);
  mobileOverlay.classList.toggle('visible', isOpen);
}

menuButton.addEventListener('click', () => toggleSidebar(true));
closeSidebar.addEventListener('click', () => toggleSidebar(false));
mobileOverlay.addEventListener('click', () => toggleSidebar(false));

newChatButton.addEventListener('click', () => {
  messages.innerHTML = `<article class="message assistant-message intro-message"><div class="message-avatar assistant-avatar">AG</div><div class="message-content"><div class="message-meta"><strong>AgriGuide</strong><time>Just now</time></div><div class="message-bubble"><p>${translations[currentLanguage].intro}</p></div></div></article>`;
  welcomeBlock.hidden = false;
  suggestions.hidden = false;
  messageInput.value = '';
  messageInput.focus();
  toggleSidebar(false);
});

languageSelect.value = currentLanguage;
languageSelect.addEventListener('change', () => {
  currentLanguage = languageSelect.value;
  if (recognition) recognition.lang = currentLanguage;
  updateLanguage();
  renderIdeas();
});
updateLanguage();
renderIdeas();
updateLocationLabel();
if (currentLocation) loadWeather(currentLocation);
async function initializeSession() {
  try {
    const response = await fetch('/api/auth/me', { credentials: 'same-origin' });
    if (!response.ok) throw new Error('No session');
    currentUser = (await response.json()).user;
    updateProfile();
    renderQuestionHistory();
  } catch (_) {
    showLogin();
  }
}

initializeSession();
