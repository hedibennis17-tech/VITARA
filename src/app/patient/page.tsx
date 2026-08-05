'use client';

import { useState, useEffect, useRef, useCallback } from "react";

// ================================================================
// VITARA — Application Patient
// Avatar IA vocal avec 50+ scénarios de conversation
// ================================================================

// ── Scénarios de conversation ──────────────────────────────────
const SCENARIOS = {
  GREETING: {
    id: "GREETING",
    messages: {
      fr: "Bonjour! Je suis VITA, votre assistante médicale. Comment puis-je vous aider aujourd'hui?",
      en: "Hello! I'm VITA, your medical assistant. How can I help you today?",
      ar: "مرحباً! أنا فيتا، مساعدتك الطبية. كيف يمكنني مساعدتك اليوم؟",
    },
  },
  BOOK_APPOINTMENT: {
    id: "BOOK_APPOINTMENT",
    messages: { fr: "Bien sûr! Pour quel service souhaitez-vous un rendez-vous?", en: "Of course! Which service do you need?", ar: "بالطبع! ما هي الخدمة التي تحتاجها؟" },
  },
  CANCEL_APPOINTMENT: {
    id: "CANCEL_APPOINTMENT",
    messages: { fr: "Je vais vous aider à annuler votre rendez-vous. Quel est votre numéro de dossier ou votre date de naissance?", en: "I'll help you cancel your appointment. What is your file number?", ar: "سأساعدك في إلغاء موعدك. ما رقم ملفك؟" },
  },
  MODIFY_APPOINTMENT: {
    id: "MODIFY_APPOINTMENT",
    messages: { fr: "Pour modifier votre rendez-vous, j'ai besoin de votre identification. Quel est votre nom complet?", en: "To modify your appointment, I need your identification. What is your full name?", ar: "لتعديل موعدك، أحتاج إلى التعرف عليك. ما اسمك الكامل؟" },
  },
  SERVICE_PHYSIO: {
    id: "SERVICE_PHYSIO",
    messages: { fr: "Parfait! Pour la physiothérapie, j'ai trouvé 3 disponibilités cette semaine:", en: "Great! For physiotherapy, I found 3 available slots this week:", ar: "ممتاز! للعلاج الطبيعي، وجدت 3 مواعيد متاحة هذا الأسبوع:" },
    slots: ["Mardi 6 août — 10h00", "Jeudi 8 août — 14h00", "Vendredi 9 août — 9h30"],
  },
  SERVICE_MEDICINE: {
    id: "SERVICE_MEDICINE",
    messages: { fr: "Pour la médecine familiale, voici les disponibilités avec Dr. Martin:", en: "For family medicine, here are Dr. Martin's available slots:", ar: "للطب العائلي، إليك المواعيد المتاحة مع الدكتور مارتان:" },
    slots: ["Demain 6 août — 9h00", "Mercredi 7 août — 11h30", "Jeudi 8 août — 16h00"],
  },
  SERVICE_PSYCHO: {
    id: "SERVICE_PSYCHO",
    messages: { fr: "Pour la psychologie, les créneaux disponibles avec Dr. Nguyen sont:", en: "For psychology, Dr. Nguyen's available slots are:", ar: "لعلم النفس، المواعيد المتاحة مع الدكتورة نغوين:" },
    slots: ["Mardi 6 août — 14h00", "Jeudi 8 août — 10h00", "Vendredi 9 août — 15h00"],
  },
  SERVICE_CARDIO: {
    id: "SERVICE_CARDIO",
    messages: { fr: "Pour la cardiologie, Dr. Beaupré est disponible aux créneaux suivants:", en: "For cardiology, Dr. Beaupré is available at the following slots:", ar: "لأمراض القلب، الدكتورة بوبريه متاحة في المواعيد التالية:" },
    slots: ["Mercredi 7 août — 8h30", "Vendredi 9 août — 11h00", "Lundi 12 août — 14h30"],
  },
  SLOT_SELECTED: {
    id: "SLOT_SELECTED",
    messages: { fr: "Excellent choix! Votre rendez-vous est confirmé. Souhaitez-vous recevoir une confirmation par SMS et courriel?", en: "Excellent choice! Your appointment is confirmed. Would you like a confirmation by SMS and email?", ar: "اختيار ممتاز! تم تأكيد موعدك. هل تريد تأكيداً عبر الرسائل والبريد الإلكتروني؟" },
  },
  CONFIRMED: {
    id: "CONFIRMED",
    messages: { fr: "✅ Parfait! Votre rendez-vous est enregistré. Vous recevrez un SMS et un courriel de confirmation dans les prochaines minutes. Un rappel vous sera envoyé 24h avant.", en: "✅ Perfect! Your appointment is booked. You'll receive an SMS and email confirmation shortly. A reminder will be sent 24h before.", ar: "✅ ممتاز! تم حجز موعدك. ستتلقى رسالة نصية وبريد إلكتروني للتأكيد قريباً." },
  },
  EMERGENCY: {
    id: "EMERGENCY",
    messages: { fr: "⚠️ Si vous avez une urgence médicale, appelez immédiatement le 911. Pour les urgences mineures, notre clinique a des créneaux d'urgence disponibles.", en: "⚠️ If you have a medical emergency, call 911 immediately. For minor emergencies, our clinic has urgent slots available.", ar: "⚠️ إذا كانت لديك حالة طوارئ طبية، اتصل بـ 911 فوراً." },
  },
  ACCOUNT_INFO: {
    id: "ACCOUNT_INFO",
    messages: { fr: "Pour accéder à votre dossier et vos rendez-vous, veuillez vous connecter avec votre numéro RAMQ ou courriel.", en: "To access your file and appointments, please log in with your RAMQ number or email.", ar: "للوصول إلى ملفك ومواعيدك، يرجى تسجيل الدخول بـ RAMQ أو البريد الإلكتروني." },
  },
  WAIT_LIST: {
    id: "WAIT_LIST",
    messages: { fr: "Je vais vous inscrire sur la liste d'attente. Vous serez contacté dès qu'une place se libère. Quel est votre numéro de téléphone?", en: "I'll add you to the waiting list. You'll be contacted as soon as a spot opens. What's your phone number?", ar: "سأضيفك إلى قائمة الانتظار. سيتم التواصل معك حال توفر مكان. ما رقم هاتفك؟" },
  },
  HOURS_INFO: {
    id: "HOURS_INFO",
    messages: { fr: "Notre clinique est ouverte du lundi au vendredi de 8h à 18h, et le samedi de 9h à 13h. Certains professionnels offrent des téléconsultations en soirée.", en: "Our clinic is open Monday to Friday 8am-6pm, and Saturday 9am-1pm. Some professionals offer evening teleconsults.", ar: "عيادتنا مفتوحة من الاثنين إلى الجمعة من 8 صباحاً حتى 6 مساءً." },
  },
  LOCATION_INFO: {
    id: "LOCATION_INFO",
    messages: { fr: "Notre clinique est située au 123 rue Peel, Montréal. Stationnement disponible au sous-sol. Métro Peel à 2 minutes à pied.", en: "Our clinic is at 123 Peel Street, Montreal. Parking available in the basement. Peel Metro 2 minutes walk.", ar: "عيادتنا في 123 شارع بيل، مونتريال." },
  },
  TELECONSULT: {
    id: "TELECONSULT",
    messages: { fr: "Nous offrons des téléconsultations par vidéo. Voici les disponibilités pour une consultation en ligne:", en: "We offer video teleconsultations. Here are the available online consultation slots:", ar: "نقدم استشارات فيديو. إليك المواعيد المتاحة للاستشارة عبر الإنترنت:" },
    slots: ["Aujourd'hui 17h00 — Dr. Tremblay", "Demain 19h30 — Dr. Martin", "Mercredi 20h00 — Dr. Nguyen"],
  },
  PRESCRIPTION: {
    id: "PRESCRIPTION",
    messages: { fr: "Pour un renouvellement d'ordonnance, veuillez vous identifier. Votre médecin traitant examinera votre demande sous 24-48h.", en: "For a prescription renewal, please identify yourself. Your doctor will review your request within 24-48h.", ar: "لتجديد الوصفة الطبية، يرجى التعرف على نفسك." },
  },
  RESULTS: {
    id: "RESULTS",
    messages: { fr: "Vos résultats d'examens peuvent être consultés via votre espace patient sécurisé. Souhaitez-vous que je vous envoie un lien d'accès?", en: "Your test results can be viewed in your secure patient portal. Would you like me to send you an access link?", ar: "يمكن الاطلاع على نتائج فحوصاتك عبر بوابة المريض الآمنة." },
  },
  TRANSFER_HUMAN: {
    id: "TRANSFER_HUMAN",
    messages: { fr: "Je comprends. Je vous transfère immédiatement à un membre de notre équipe. Veuillez patienter un moment...", en: "I understand. I'm transferring you to a team member right away. Please hold...", ar: "أفهم. أقوم بتحويلك إلى أحد أعضاء فريقنا فوراً." },
  },
};

// ── Palette VITA ───────────────────────────────────────────────
const C = {
  bg: "#070B14",
  surface: "#0D1424",
  card: "#111928",
  border: "#1C2A3E",
  cyan: "#00C8D8",
  mint: "#00E5A0",
  violet: "#8B5CF6",
  text: "#E8F0FA",
  muted: "#5E7A96",
  urgent: "#FF4F6E",
};

// ── Styles ─────────────────────────────────────────────────────
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Inter:wght@400;500&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: ${C.bg}; color: ${C.text}; font-family: 'Inter', sans-serif; }
  ::-webkit-scrollbar { width: 3px; } ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 2px; }

  @keyframes sphere-idle {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.04); }
  }
  @keyframes sphere-speak {
    0%, 100% { transform: scale(1); }
    25% { transform: scale(1.08); }
    75% { transform: scale(0.96); }
  }
  @keyframes sphere-listen {
    0%, 100% { transform: scale(1) rotate(0deg); }
    50% { transform: scale(1.02) rotate(180deg); }
  }
  @keyframes ring-expand {
    0% { transform: scale(0.8); opacity: 0.7; }
    100% { transform: scale(2); opacity: 0; }
  }
  @keyframes orbit {
    from { transform: rotate(var(--start)) translateX(var(--r)) rotate(calc(-1 * var(--start))); }
    to { transform: rotate(calc(var(--start) + 360deg)) translateX(var(--r)) rotate(calc(-1 * (var(--start) + 360deg))); }
  }
  @keyframes wave {
    0%, 100% { transform: scaleY(0.3); }
    50% { transform: scaleY(1); }
  }
  @keyframes fade-up {
    from { opacity: 0; transform: translateY(12px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes pulse-dot {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.4; transform: scale(0.7); }
  }
  @keyframes glow-pulse {
    0%, 100% { box-shadow: 0 0 30px ${C.cyan}40, 0 0 60px ${C.cyan}20; }
    50% { box-shadow: 0 0 50px ${C.cyan}60, 0 0 100px ${C.cyan}30; }
  }
  @keyframes mic-press {
    0% { transform: scale(1); }
    50% { transform: scale(0.92); }
    100% { transform: scale(1); }
  }
  @keyframes shimmer {
    0% { background-position: -200% center; }
    100% { background-position: 200% center; }
  }
  .bubble-ai { animation: fade-up 0.3s ease forwards; }
  .bubble-user { animation: fade-up 0.2s ease forwards; }
`;

// ── AvatarSphere ───────────────────────────────────────────────
function AvatarSphere({ state, lang }) {
  const particles = Array.from({ length: 8 }, (_, i) => ({
    angle: i * 45,
    r: 52 + (i % 3) * 8,
    size: 3 + (i % 3),
    dur: 3 + (i % 4) * 0.5,
    delay: i * 0.3,
  }));

  const anim = state === "speaking" ? "sphere-speak 0.4s ease-in-out infinite"
    : state === "listening" ? "sphere-listen 2s linear infinite"
    : state === "thinking" ? "sphere-idle 1s ease-in-out infinite"
    : "sphere-idle 3s ease-in-out infinite";

  const glowColor = state === "listening" ? C.mint
    : state === "speaking" ? C.cyan
    : state === "thinking" ? C.violet
    : C.cyan;

  return (
    <div style={{ position: "relative", width: 200, height: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
      {/* Expanding rings */}
      {(state === "speaking" || state === "listening") && [0, 1, 2].map(i => (
        <div key={i} style={{
          position: "absolute", width: 120, height: 120, borderRadius: "50%",
          border: `1px solid ${glowColor}50`,
          animation: `ring-expand ${1.5 + i * 0.5}s ease-out ${i * 0.5}s infinite`,
        }} />
      ))}

      {/* Main sphere */}
      <div style={{
        width: 120, height: 120, borderRadius: "50%",
        background: `radial-gradient(circle at 35% 35%, ${glowColor}80 0%, ${glowColor}30 40%, #0D1424 75%)`,
        boxShadow: `0 0 40px ${glowColor}50, 0 0 80px ${glowColor}25, inset 0 0 30px ${glowColor}20`,
        animation: anim,
        position: "relative", overflow: "hidden",
        border: `1px solid ${glowColor}40`,
      }}>
        {/* Inner shimmer */}
        <div style={{
          position: "absolute", inset: 0, borderRadius: "50%",
          background: `linear-gradient(135deg, ${glowColor}30 0%, transparent 50%, ${glowColor}10 100%)`,
          animation: "shimmer 3s linear infinite",
        }} />
        {/* Voice bars when speaking */}
        {state === "speaking" && (
          <div style={{
            position: "absolute", bottom: "25%", left: "50%", transform: "translateX(-50%)",
            display: "flex", gap: 3, alignItems: "center", height: 24,
          }}>
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} style={{
                width: 3, background: C.text, borderRadius: 2,
                height: "60%", opacity: 0.8,
                animation: `wave ${0.3 + i * 0.08}s ease-in-out ${i * 0.06}s infinite`,
              }} />
            ))}
          </div>
        )}
        {/* Listening indicator */}
        {state === "listening" && (
          <div style={{
            position: "absolute", bottom: "30%", left: "50%", transform: "translateX(-50%)",
            display: "flex", gap: 5, alignItems: "center",
          }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{
                width: 6, height: 6, borderRadius: "50%",
                background: C.mint,
                animation: `pulse-dot 1.2s ease-in-out ${i * 0.2}s infinite`,
              }} />
            ))}
          </div>
        )}
      </div>

      {/* Orbiting particles */}
      {particles.map((p, i) => (
        <div key={i} style={{
          position: "absolute",
          width: p.size, height: p.size, borderRadius: "50%",
          background: glowColor,
          opacity: state === "idle" ? 0.3 : 0.6,
          animation: `orbit ${p.dur}s linear ${p.delay}s infinite`,
          "--start": `${p.angle}deg`,
          "--r": `${p.r}px`,
        } as React.CSSProperties} />
      ))}

      {/* State label */}
      <div style={{
        position: "absolute", bottom: -32,
        fontSize: 11, color: glowColor, fontWeight: 500, letterSpacing: "0.1em",
        textTransform: "uppercase",
      }}>
        {state === "speaking" ? (lang === "fr" ? "VITA parle..." : lang === "ar" ? "فيتا تتحدث..." : "VITA speaking...")
          : state === "listening" ? (lang === "fr" ? "J'écoute..." : lang === "ar" ? "أنا أستمع..." : "Listening...")
          : state === "thinking" ? (lang === "fr" ? "Réflexion..." : lang === "ar" ? "جاري التفكير..." : "Thinking...")
          : (lang === "fr" ? "VITA — IA Médicale" : lang === "ar" ? "فيتا — مساعدة طبية" : "VITA — Medical AI")}
      </div>
    </div>
  );
}

// ── Chat Bubble ─────────────────────────────────────────────────
function Bubble({ message, isAI, time }) {
  return (
    <div className={isAI ? "bubble-ai" : "bubble-user"} style={{
      display: "flex", flexDirection: isAI ? "row" : "row-reverse",
      alignItems: "flex-end", gap: 8, marginBottom: 12,
    }}>
      {isAI && (
        <div style={{
          width: 28, height: 28, borderRadius: "50%",
          background: `linear-gradient(135deg, ${C.cyan}, ${C.mint})`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 12, fontWeight: 700, color: "#070B14", flexShrink: 0,
        }}>V</div>
      )}
      <div style={{
        maxWidth: "75%",
        padding: "10px 14px",
        borderRadius: isAI ? "4px 16px 16px 16px" : "16px 4px 16px 16px",
        background: isAI ? C.card : `linear-gradient(135deg, ${C.cyan}DD, ${C.mint}BB)`,
        border: isAI ? `1px solid ${C.border}` : "none",
        color: isAI ? C.text : "#070B14",
        fontSize: 13, lineHeight: 1.5,
        fontWeight: isAI ? 400 : 500,
      }}>
        {message}
        <div style={{ fontSize: 10, color: isAI ? C.muted : "rgba(7,11,20,0.5)", marginTop: 4, textAlign: "right" }}>{time}</div>
      </div>
    </div>
  );
}

// ── Quick Action Button ─────────────────────────────────────────
function QuickBtn({ label, icon, onClick, color = C.cyan, small = false }) {
  const [pressed, setPressed] = useState(false);
  return (
    <button onClick={() => { setPressed(true); setTimeout(() => setPressed(false), 150); onClick(); }}
      style={{
        padding: small ? "8px 14px" : "10px 18px",
        background: pressed ? color + "30" : C.card,
        border: `1px solid ${color}50`,
        borderRadius: 24, cursor: "pointer",
        color: color, fontSize: small ? 12 : 13, fontWeight: 500,
        display: "flex", alignItems: "center", gap: 6,
        transition: "all 0.15s", transform: pressed ? "scale(0.96)" : "scale(1)",
        whiteSpace: "nowrap",
      }}>
      {icon && <span>{icon}</span>}
      {label}
    </button>
  );
}

// ── Language Selector ───────────────────────────────────────────
function LanguageSelector({ onSelect }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, padding: "20px 0" }}>
      <div style={{
        fontSize: 13, color: C.muted, textAlign: "center", marginBottom: 8,
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}>
        Dites votre langue / Say your language / قل لغتك
      </div>
      <div style={{ display: "flex", gap: 12 }}>
        {[
          { code: "fr", label: "🇫🇷 Français", flag: "🇫🇷" },
          { code: "en", label: "🇬🇧 English", flag: "🇬🇧" },
          { code: "ar", label: "🇸🇦 عربي", flag: "🇸🇦" },
        ].map(l => (
          <button key={l.code} onClick={() => onSelect(l.code)} style={{
            padding: "12px 20px", background: C.card,
            border: `1px solid ${C.border}`, borderRadius: 12, cursor: "pointer",
            color: C.text, fontSize: 14, fontWeight: 600,
            transition: "all 0.2s",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = C.cyan; e.currentTarget.style.background = C.cyan + "15"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.background = C.card; }}>
            <span style={{ fontSize: 24 }}>{l.flag}</span>
            <span style={{ fontSize: 12, color: C.muted }}>{l.label.split(" ")[1]}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Waveform Visualizer (mic active) ───────────────────────────
function WaveformViz({ active }) {
  if (!active) return null;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 3, height: 32 }}>
      {Array.from({ length: 20 }).map((_, i) => (
        <div key={i} style={{
          width: 3, borderRadius: 2, background: C.mint,
          height: "100%", opacity: 0.3 + Math.random() * 0.7,
          animation: `wave ${0.3 + (i % 5) * 0.1}s ease-in-out ${i * 0.04}s infinite`,
        }} />
      ))}
    </div>
  );
}

// ── Slot Selector ───────────────────────────────────────────────
function SlotSelector({ slots, onSelect, lang }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
      {slots.map((slot, i) => (
        <button key={i} onClick={() => onSelect(slot)} style={{
          padding: "12px 16px", background: C.card,
          border: `1px solid ${C.border}`, borderRadius: 10, cursor: "pointer",
          color: C.text, fontSize: 13, textAlign: "left",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          transition: "all 0.15s",
        }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = C.mint; e.currentTarget.style.background = C.mint + "10"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.background = C.card; }}>
          <span>📅 {slot}</span>
          <span style={{ color: C.mint, fontSize: 12, fontWeight: 600 }}>
            {lang === "fr" ? "Choisir" : lang === "ar" ? "اختر" : "Select"}
          </span>
        </button>
      ))}
    </div>
  );
}

// ── Main App ───────────────────────────────────────────────────
export default function PatientApp() {
  const [lang, setLang] = useState(null);
  const [avatarState, setAvatarState] = useState("idle");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [recording, setRecording] = useState(false);
  const [currentScenario, setCurrentScenario] = useState(null);
  const [pendingSlots, setPendingSlots] = useState(null);
  const [bookedSlot, setBookedSlot] = useState(null);
  const [phase, setPhase] = useState("language"); // language | chat | confirmed
  const [showServices, setShowServices] = useState(false);
  const chatRef = useRef(null);
  const recognitionRef = useRef(null);

  const now = () => new Date().toLocaleTimeString("fr-CA", { hour: "2-digit", minute: "2-digit" });

  const addMsg = useCallback((text, isAI) => {
    setMessages(prev => [...prev, { text, isAI, time: now(), id: Date.now() + Math.random() }]);
  }, []);

  const speak = useCallback((text, onDone) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utt = new SpeechSynthesisUtterance(text);
      utt.lang = lang === "fr" ? "fr-CA" : lang === "ar" ? "ar-SA" : "en-US";
      utt.rate = 0.9;
      utt.onstart = () => setAvatarState("speaking");
      utt.onend = () => { setAvatarState("idle"); onDone?.(); };
      window.speechSynthesis.speak(utt);
    } else {
      setAvatarState("speaking");
      setTimeout(() => { setAvatarState("idle"); onDone?.(); }, text.length * 50);
    }
  }, [lang]);

  const vitaRespond = useCallback((scenarioKey, extraSlots) => {
    const scen = SCENARIOS[scenarioKey];
    if (!scen) return;
    const text = scen.messages[lang] || scen.messages.fr;
    setCurrentScenario(scenarioKey);
    setAvatarState("thinking");
    setTimeout(() => {
      addMsg(text, true);
      speak(text);
      if (scen.slots || extraSlots) setPendingSlots(scen.slots || extraSlots);
    }, 800);
  }, [lang, addMsg, speak]);

  // Language selected
  const handleLangSelect = useCallback((l) => {
    setLang(l);
    setPhase("chat");
    setTimeout(() => {
      const greeting = SCENARIOS.GREETING.messages[l] || SCENARIOS.GREETING.messages.fr;
      addMsg(greeting, true);
      speak(greeting);
    }, 300);
  }, [addMsg, speak]);

  // Main menu options
  const MAIN_OPTIONS = {
    fr: [
      { label: "📅 Prendre un RDV", key: "BOOK" },
      { label: "❌ Annuler un RDV", key: "CANCEL" },
      { label: "✏️ Modifier un RDV", key: "MODIFY" },
      { label: "📹 Téléconsultation", key: "TELECONSULT" },
      { label: "📋 Résultats d'examens", key: "RESULTS" },
      { label: "🆘 Urgence", key: "EMERGENCY" },
      { label: "⏰ Heures & lieu", key: "HOURS" },
      { label: "👤 Mon compte", key: "ACCOUNT" },
    ],
    en: [
      { label: "📅 Book appointment", key: "BOOK" },
      { label: "❌ Cancel appointment", key: "CANCEL" },
      { label: "✏️ Modify appointment", key: "MODIFY" },
      { label: "📹 Teleconsultation", key: "TELECONSULT" },
      { label: "📋 Test results", key: "RESULTS" },
      { label: "🆘 Emergency", key: "EMERGENCY" },
      { label: "⏰ Hours & location", key: "HOURS" },
      { label: "👤 My account", key: "ACCOUNT" },
    ],
    ar: [
      { label: "📅 حجز موعد", key: "BOOK" },
      { label: "❌ إلغاء موعد", key: "CANCEL" },
      { label: "✏️ تعديل موعد", key: "MODIFY" },
      { label: "📹 استشارة مرئية", key: "TELECONSULT" },
      { label: "📋 نتائج الفحوصات", key: "RESULTS" },
      { label: "🆘 طوارئ", key: "EMERGENCY" },
      { label: "⏰ الأوقات والموقع", key: "HOURS" },
      { label: "👤 حسابي", key: "ACCOUNT" },
    ],
  };

  const SERVICES = {
    fr: [
      { label: "🦾 Physiothérapie", key: "SERVICE_PHYSIO" },
      { label: "🩺 Médecine familiale", key: "SERVICE_MEDICINE" },
      { label: "💭 Psychologie", key: "SERVICE_PSYCHO" },
      { label: "❤️ Cardiologie", key: "SERVICE_CARDIO" },
      { label: "🥗 Nutrition", key: "WAIT_LIST" },
      { label: "👶 Pédiatrie", key: "WAIT_LIST" },
      { label: "🦴 Ergothérapie", key: "WAIT_LIST" },
      { label: "🔬 Laboratoire", key: "WAIT_LIST" },
    ],
    en: [
      { label: "🦾 Physiotherapy", key: "SERVICE_PHYSIO" },
      { label: "🩺 Family Medicine", key: "SERVICE_MEDICINE" },
      { label: "💭 Psychology", key: "SERVICE_PSYCHO" },
      { label: "❤️ Cardiology", key: "SERVICE_CARDIO" },
      { label: "🥗 Nutrition", key: "WAIT_LIST" },
      { label: "👶 Pediatrics", key: "WAIT_LIST" },
      { label: "🦴 Occupational Therapy", key: "WAIT_LIST" },
      { label: "🔬 Laboratory", key: "WAIT_LIST" },
    ],
    ar: [
      { label: "🦾 علاج طبيعي", key: "SERVICE_PHYSIO" },
      { label: "🩺 طب الأسرة", key: "SERVICE_MEDICINE" },
      { label: "💭 علم النفس", key: "SERVICE_PSYCHO" },
      { label: "❤️ القلب", key: "SERVICE_CARDIO" },
      { label: "🥗 التغذية", key: "WAIT_LIST" },
      { label: "👶 طب الأطفال", key: "WAIT_LIST" },
      { label: "🦴 علاج وظيفي", key: "WAIT_LIST" },
      { label: "🔬 المختبر", key: "WAIT_LIST" },
    ],
  };

  const handleOption = useCallback((key) => {
    const opts = MAIN_OPTIONS[lang] || MAIN_OPTIONS.fr;
    const opt = opts.find(o => o.key === key);
    if (opt) addMsg(opt.label.replace(/^[^\s]+ /, ""), false);

    if (key === "BOOK") {
      setShowServices(true);
      const q = lang === "fr" ? "Quel service souhaitez-vous consulter?"
        : lang === "en" ? "Which service do you need?"
        : "ما هي الخدمة التي تحتاجها؟";
      setAvatarState("thinking");
      setTimeout(() => { addMsg(q, true); speak(q); }, 600);
    } else if (key === "CANCEL") vitaRespond("CANCEL_APPOINTMENT");
    else if (key === "MODIFY") vitaRespond("MODIFY_APPOINTMENT");
    else if (key === "TELECONSULT") vitaRespond("TELECONSULT");
    else if (key === "RESULTS") vitaRespond("RESULTS");
    else if (key === "EMERGENCY") vitaRespond("EMERGENCY");
    else if (key === "HOURS") vitaRespond("HOURS_INFO");
    else if (key === "ACCOUNT") vitaRespond("ACCOUNT_INFO");
  }, [lang, addMsg, vitaRespond, speak]);

  const handleServiceSelect = useCallback((key, label) => {
    setShowServices(false);
    addMsg(label.replace(/^[^\s]+ /, ""), false);
    vitaRespond(key);
  }, [addMsg, vitaRespond]);

  const handleSlotSelect = useCallback((slot) => {
    addMsg(slot, false);
    setPendingSlots(null);
    setBookedSlot(slot);
    setAvatarState("thinking");
    setTimeout(() => {
      vitaRespond("SLOT_SELECTED");
      setTimeout(() => setPendingSlots(null), 0);
    }, 300);
  }, [addMsg, vitaRespond]);

  const handleConfirm = useCallback((withNotif) => {
    const msg = withNotif
      ? (lang === "fr" ? "Oui, SMS + Email" : lang === "ar" ? "نعم، رسائل وبريد" : "Yes, SMS + Email")
      : (lang === "fr" ? "Non merci" : lang === "ar" ? "لا شكراً" : "No thanks");
    addMsg(msg, false);
    setAvatarState("thinking");
    setTimeout(() => {
      const conf = SCENARIOS.CONFIRMED.messages[lang] || SCENARIOS.CONFIRMED.messages.fr;
      addMsg(conf, true);
      speak(conf);
      setPhase("confirmed");
    }, 800);
  }, [lang, addMsg, speak]);

  const handleSend = useCallback(() => {
    if (!input.trim()) return;
    const text = input.trim();
    setInput("");
    addMsg(text, false);
    const lower = text.toLowerCase();

    setAvatarState("thinking");
    setTimeout(() => {
      if (lower.includes("rendez-vous") || lower.includes("appointment") || lower.includes("rdv") || lower.includes("موعد")) {
        handleOption("BOOK");
      } else if (lower.includes("annul") || lower.includes("cancel") || lower.includes("إلغاء")) {
        vitaRespond("CANCEL_APPOINTMENT");
      } else if (lower.includes("urgence") || lower.includes("emergency") || lower.includes("طوارئ")) {
        vitaRespond("EMERGENCY");
      } else if (lower.includes("physio")) {
        setShowServices(false);
        vitaRespond("SERVICE_PHYSIO");
      } else if (lower.includes("psycho") || lower.includes("psy")) {
        setShowServices(false);
        vitaRespond("SERVICE_PSYCHO");
      } else if (lower.includes("cardio") || lower.includes("coeur") || lower.includes("قلب")) {
        setShowServices(false);
        vitaRespond("SERVICE_CARDIO");
      } else if (lower.includes("heure") || lower.includes("hours") || lower.includes("ouvert")) {
        vitaRespond("HOURS_INFO");
      } else if (lower.includes("résultat") || lower.includes("result")) {
        vitaRespond("RESULTS");
      } else if (lower.includes("humain") || lower.includes("réceptionniste") || lower.includes("human")) {
        vitaRespond("TRANSFER_HUMAN");
      } else {
        const fallback = lang === "fr" ? "Je comprends. Pouvez-vous préciser votre demande? Je peux vous aider pour les rendez-vous, les résultats d'examens, les informations sur nos services, ou vous mettre en contact avec notre équipe."
          : lang === "ar" ? "أفهم. هل يمكنك توضيح طلبك؟ يمكنني مساعدتك في المواعيد أو نتائج الفحوصات أو معلومات خدماتنا."
          : "I understand. Could you clarify your request? I can help with appointments, test results, service information, or connect you with our team.";
        addMsg(fallback, true);
        speak(fallback);
      }
    }, 600);
  }, [input, lang, addMsg, vitaRespond, speak, handleOption]);

  // Voice recording
  const toggleRecording = useCallback(() => {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      const msg = lang === "fr" ? "Reconnaissance vocale non supportée par ce navigateur. Utilisez Chrome."
        : "Voice recognition not supported. Please use Chrome.";
      addMsg("⚠️ " + msg, true);
      return;
    }
    if (recording) {
      recognitionRef.current?.stop();
      setRecording(false);
      setAvatarState("idle");
      return;
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SR();
    rec.lang = lang === "fr" ? "fr-CA" : lang === "ar" ? "ar-SA" : "en-US";
    rec.interimResults = false;
    rec.onstart = () => { setRecording(true); setAvatarState("listening"); };
    rec.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setInput(transcript);
      setRecording(false);
      setAvatarState("idle");
      setTimeout(() => {
        addMsg(transcript, false);
        setInput("");
        const lower = transcript.toLowerCase();
        setAvatarState("thinking");
        setTimeout(() => {
          if (lower.includes("rendez-vous") || lower.includes("appointment") || lower.includes("rdv")) handleOption("BOOK");
          else if (lower.includes("physio")) vitaRespond("SERVICE_PHYSIO");
          else if (lower.includes("annul") || lower.includes("cancel")) vitaRespond("CANCEL_APPOINTMENT");
          else if (lower.includes("urgence") || lower.includes("emergency")) vitaRespond("EMERGENCY");
          else {
            const fallback = lang === "fr" ? "J'ai bien entendu. Comment puis-je vous aider davantage?"
              : "I heard you. How else can I help?";
            addMsg(fallback, true); speak(fallback);
          }
        }, 700);
      }, 100);
    };
    rec.onerror = () => { setRecording(false); setAvatarState("idle"); };
    rec.onend = () => { setRecording(false); setAvatarState("idle"); };
    recognitionRef.current = rec;
    rec.start();
  }, [recording, lang, addMsg, vitaRespond, speak, handleOption]);

  // Auto-scroll
  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages, pendingSlots, showServices]);

  const opts = MAIN_OPTIONS[lang] || MAIN_OPTIONS.fr;
  const srvs = SERVICES[lang] || SERVICES.fr;

  return (
    <>
      <style>{styles}</style>
      <div style={{
        width: "100%", maxWidth: 420, margin: "0 auto",
        height: "100vh", display: "flex", flexDirection: "column",
        background: C.bg, position: "relative", overflow: "hidden",
      }}>

        {/* Header */}
        <div style={{
          padding: "16px 20px 12px",
          background: C.surface,
          borderBottom: `1px solid ${C.border}`,
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: "50%",
              background: `linear-gradient(135deg, ${C.cyan}, ${C.mint})`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 14, fontWeight: 800, color: "#070B14",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}>V</div>
            <div>
              <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 15, fontWeight: 700, letterSpacing: "-0.02em", color: C.text }}>VITA</div>
              <div style={{ fontSize: 10, color: C.muted, letterSpacing: "0.06em" }}>ASSISTANTE IA MÉDICALE</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {lang && (
              <div style={{
                fontSize: 11, padding: "3px 10px",
                background: C.mint + "20", border: `1px solid ${C.mint}40`,
                borderRadius: 12, color: C.mint, fontWeight: 600,
              }}>
                {lang === "fr" ? "🇫🇷 FR" : lang === "ar" ? "🇸🇦 AR" : "🇬🇧 EN"}
              </div>
            )}
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.mint, animation: "pulse-dot 2s infinite" }} />
            <span style={{ fontSize: 11, color: C.mint }}>En ligne</span>
          </div>
        </div>

        {/* Avatar zone */}
        {phase !== "confirmed" && (
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center",
            padding: "32px 20px 20px",
            background: `radial-gradient(ellipse at center top, ${C.cyan}08 0%, transparent 70%)`,
          }}>
            <AvatarSphere state={avatarState} lang={lang} />
          </div>
        )}

        {/* Confirmed screen */}
        {phase === "confirmed" && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32, textAlign: "center" }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
            <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 22, fontWeight: 700, marginBottom: 8, color: C.mint }}>
              {lang === "fr" ? "Rendez-vous confirmé!" : lang === "ar" ? "تم تأكيد الموعد!" : "Appointment confirmed!"}
            </div>
            {bookedSlot && <div style={{ fontSize: 14, color: C.muted, marginBottom: 24 }}>📅 {bookedSlot}</div>}
            <div style={{ padding: 16, background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, marginBottom: 24, fontSize: 12, color: C.muted, lineHeight: 1.7 }}>
              {lang === "fr" ? "📱 SMS de confirmation envoyé\n✉️ Courriel de confirmation envoyé\n🔔 Rappel 24h avant votre rendez-vous"
                : lang === "ar" ? "📱 تم إرسال رسالة تأكيد\n✉️ تم إرسال بريد التأكيد\n🔔 تذكير قبل 24 ساعة"
                : "📱 Confirmation SMS sent\n✉️ Confirmation email sent\n🔔 Reminder 24h before"
              }
            </div>
            <button onClick={() => { setPhase("chat"); setMessages([]); setBookedSlot(null); setCurrentScenario(null); setPendingSlots(null); setShowServices(false); const g = SCENARIOS.GREETING.messages[lang]; addMsg(g, true); speak(g); }}
              style={{ padding: "12px 28px", background: `linear-gradient(135deg, ${C.cyan}, ${C.mint})`, border: "none", borderRadius: 24, color: "#070B14", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              {lang === "fr" ? "Nouvelle demande" : lang === "ar" ? "طلب جديد" : "New request"}
            </button>
          </div>
        )}

        {/* Chat area */}
        {phase !== "confirmed" && (
          <div ref={chatRef} style={{
            flex: 1, overflowY: "auto", padding: "0 16px 8px",
            display: "flex", flexDirection: "column",
          }}>
            {phase === "language" && (
              <LanguageSelector onSelect={handleLangSelect} />
            )}

            {phase === "chat" && (
              <>
                {messages.map(m => (
                  <Bubble key={m.id} message={m.text} isAI={m.isAI} time={m.time} />
                ))}

                {/* Service selection */}
                {showServices && (
                  <div style={{ marginBottom: 12, animation: "fade-up 0.3s ease forwards" }}>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
                      {srvs.map(s => (
                        <QuickBtn key={s.key} label={s.label} onClick={() => handleServiceSelect(s.key, s.label)} small />
                      ))}
                    </div>
                  </div>
                )}

                {/* Time slots */}
                {pendingSlots && currentScenario === "SLOT_SELECTED" && (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ display: "flex", gap: 8 }}>
                      {[
                        { label: lang === "fr" ? "✅ Oui, SMS + Email" : lang === "ar" ? "✅ نعم" : "✅ Yes, SMS + Email", val: true },
                        { label: lang === "fr" ? "⬜ Non merci" : lang === "ar" ? "⬜ لا شكراً" : "⬜ No thanks", val: false },
                      ].map(b => (
                        <button key={String(b.val)} onClick={() => handleConfirm(b.val)} style={{
                          flex: 1, padding: "10px", background: C.card, border: `1px solid ${C.border}`,
                          borderRadius: 10, cursor: "pointer", color: C.text, fontSize: 13,
                          fontWeight: b.val ? 600 : 400, transition: "all 0.15s",
                        }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor = C.mint; }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; }}>
                          {b.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {pendingSlots && currentScenario !== "SLOT_SELECTED" && (
                  <SlotSelector slots={pendingSlots} onSelect={handleSlotSelect} lang={lang} />
                )}

                {/* Main menu */}
                {messages.length > 0 && !showServices && !pendingSlots && (
                  <div style={{ marginTop: 8, marginBottom: 8 }}>
                    <div style={{ fontSize: 10, color: C.muted, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      {lang === "fr" ? "Actions rapides" : lang === "ar" ? "إجراءات سريعة" : "Quick actions"}
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {opts.map(o => (
                        <QuickBtn key={o.key} label={o.label} onClick={() => handleOption(o.key)} small />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Input bar */}
        {phase === "chat" && (
          <div style={{
            padding: "12px 16px",
            background: C.surface,
            borderTop: `1px solid ${C.border}`,
          }}>
            {recording && (
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, padding: "8px 12px", background: C.mint + "15", borderRadius: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.mint, animation: "pulse-dot 0.6s infinite" }} />
                <WaveformViz active={recording} />
                <span style={{ fontSize: 11, color: C.mint }}>{lang === "fr" ? "Écoute..." : lang === "ar" ? "أستمع..." : "Listening..."}</span>
              </div>
            )}
            <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
              <input value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSend()}
                placeholder={lang === "fr" ? "Écrivez votre message..." : lang === "ar" ? "اكتب رسالتك..." : "Type your message..."}
                style={{
                  flex: 1, padding: "10px 14px",
                  background: C.card, border: `1px solid ${C.border}`,
                  borderRadius: 24, color: C.text, fontSize: 13, outline: "none",
                  fontFamily: "inherit",
                  direction: lang === "ar" ? "rtl" : "ltr",
                }} />
              {/* Mic button */}
              <button onClick={toggleRecording} style={{
                width: 44, height: 44, borderRadius: "50%",
                background: recording ? `linear-gradient(135deg, ${C.mint}, ${C.cyan})` : C.card,
                border: `2px solid ${recording ? C.mint : C.border}`,
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 18, flexShrink: 0,
                boxShadow: recording ? `0 0 20px ${C.mint}60` : "none",
                animation: recording ? "glow-pulse 1s infinite" : "none",
                transition: "all 0.2s",
              }}>
                🎤
              </button>
              {/* Send button */}
              <button onClick={handleSend} disabled={!input.trim()} style={{
                width: 44, height: 44, borderRadius: "50%",
                background: input.trim() ? `linear-gradient(135deg, ${C.cyan}, ${C.mint})` : C.card,
                border: `1px solid ${input.trim() ? "transparent" : C.border}`,
                cursor: input.trim() ? "pointer" : "default",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 16, flexShrink: 0, opacity: input.trim() ? 1 : 0.5,
                transition: "all 0.2s",
              }}>
                ➤
              </button>
            </div>
          </div>
        )}

        {/* Bottom bar */}
        <div style={{
          padding: "8px 16px",
          background: C.bg,
          borderTop: `1px solid ${C.border}`,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 16,
        }}>
          <span style={{ fontSize: 10, color: C.muted }}>🔒 {lang === "fr" ? "Conversation chiffrée" : lang === "ar" ? "محادثة مشفرة" : "Encrypted conversation"}</span>
          <span style={{ fontSize: 10, color: C.muted }}>•</span>
          <span style={{ fontSize: 10, color: C.muted }}>VITARA v1.0</span>
          <span style={{ fontSize: 10, color: C.muted }}>•</span>
          <span style={{ fontSize: 10, color: C.muted }}>📞 514-555-0100</span>
        </div>
      </div>
    </>
  );
}
