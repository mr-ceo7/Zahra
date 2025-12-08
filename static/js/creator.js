// ==================== DOM ELEMENTS ====================
const messageForm = document.getElementById('messageForm');
const messageText = document.getElementById('messageText');
const charCount = document.getElementById('charCount');
const charFill = document.getElementById('charFill');
const toggleCustomization = document.getElementById('toggleCustomization');
const customizationOptions = document.getElementById('customizationOptions');
const previewMessage = document.getElementById('previewMessage');
const previewContainer = document.getElementById('previewContainer');
const successModal = document.getElementById('successModal');
const shareLink = document.getElementById('shareLink');
const createBtn = document.getElementById('createBtn');
const toast = document.getElementById('toast');

// Form inputs
const inputs = {
    primaryColor: document.getElementById('primaryColor'),
    secondaryColor: document.getElementById('secondaryColor'),
    backgroundColor: document.getElementById('backgroundColor'),
    emojis: document.getElementById('emojis'),
    transitionType: document.getElementById('transitionType'),
    animationDuration: document.getElementById('animationDuration'),
    fontFamily: document.getElementById('fontFamily'),
    fontSize: document.getElementById('fontSize'),
    backgroundEffect: document.getElementById('backgroundEffect'),
    effectType: document.getElementById('effectType'),
};

// ==================== HAPTIC & AUDIO FEEDBACK ====================
function playHaptic(intensity = 'medium') {
    if (navigator.vibrate) {
        const patterns = {
            light: 10,
            medium: 20,
            heavy: 40,
        };
        navigator.vibrate(patterns[intensity] || 20);
    }
}

function playSound(type = 'click') {
    // Create audio context for sound effects
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    switch (type) {
        case 'click':
            oscillator.frequency.value = 800;
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.1);
            break;

        case 'success':
            oscillator.frequency.value = 1000;
            gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
            break;

        case 'copy':
            oscillator.frequency.value = 600;
            gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.15);
            break;
    }
}

function showToast(message, duration = 3000) {
    toast.textContent = message;
    toast.style.opacity = '1';
    setTimeout(() => {
        toast.style.opacity = '0';
    }, duration);
}

// ==================== CHARACTER COUNT ====================
messageText.addEventListener('input', () => {
    const length = messageText.value.length;
    const percentage = (length / 500) * 100;
    charCount.textContent = `${length}/500`;
    charFill.style.width = percentage + '%';
    updatePreview();
});

// ==================== FORM INTERACTIONS ====================
messageText.addEventListener('focus', () => {
    playHaptic('light');
});

messageText.addEventListener('input', () => {
    if (messageText.value.length % 50 === 0 && messageText.value.length > 0) {
        playSound('click');
    }
});

// ==================== CUSTOMIZATION TOGGLE ====================
toggleCustomization.addEventListener('click', (e) => {
    e.preventDefault();
    playHaptic('medium');
    playSound('click');
    
    const isActive = customizationOptions.classList.contains('active');
    customizationOptions.classList.toggle('active');
    toggleCustomization.classList.toggle('active');
    
    if (!isActive) {
        showToast('Customization options unlocked ✨');
    }
});

// ==================== LIVE PREVIEW ====================
function updatePreview() {
    if (!messageText.value) {
        previewMessage.innerHTML = '<p class="preview-message-empty">Your message will appear here...</p>';
        return;
    }

    const fontSize = inputs.fontSize.value;
    const fontFamily = inputs.fontFamily.value;
    const primaryColor = inputs.primaryColor.value;
    const emojis = inputs.emojis.value.split(',').map(e => e.trim()).join(' ');
    const effectType = inputs.effectType.value;

    let textStyle = `
        color: ${primaryColor};
        font-family: '${fontFamily}', sans-serif;
        font-size: ${fontSize * 0.4}px;
        font-weight: 500;
        margin-bottom: 20px;
        word-wrap: break-word;
        line-height: 1.6;
    `;

    // Add effects
    if (effectType === 'glow') {
        textStyle += `text-shadow: 0 0 20px ${primaryColor}80;`;
    } else if (effectType === 'blur') {
        textStyle += `filter: blur(0.5px);`;
    } else if (effectType === 'shadow') {
        textStyle += `text-shadow: 4px 4px 8px rgba(0, 0, 0, 0.5);`;
    }

    previewMessage.innerHTML = `
        <p style="${textStyle}">${messageText.value}</p>
        <div style="font-size: 30px; animation: float 3s ease-in-out infinite;">${emojis}</div>
    `;

    // Update background
    const bgColor = inputs.backgroundColor.value;
    const secondaryColor = inputs.secondaryColor.value;
    previewContainer.style.background = `linear-gradient(135deg, ${bgColor}, ${secondaryColor}30)`;
}

// Update preview on customization changes
Object.values(inputs).forEach(input => {
    input.addEventListener('change', updatePreview);
    input.addEventListener('input', updatePreview);
    input.addEventListener('focus', () => playHaptic('light'));
});

// ==================== FORM SUBMISSION ====================
messageForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    playHaptic('heavy');
    playSound('success');

    // Validate
    if (!messageText.value.trim()) {
        showToast('Please enter a message');
        playHaptic('light');
        return;
    }

    // Show loading state
    createBtn.disabled = true;
    createBtn.innerHTML = '<span class="spinner"></span> Creating...';
    createBtn.classList.add('btn-loading');

    try {
        const response = await fetch('/api/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                text: messageText.value,
                primaryColor: inputs.primaryColor.value,
                secondaryColor: inputs.secondaryColor.value,
                backgroundColor: inputs.backgroundColor.value,
                emojis: inputs.emojis.value.split(',').map(e => e.trim()),
                transitionType: inputs.transitionType.value,
                animationDuration: parseInt(inputs.animationDuration.value),
                fontFamily: inputs.fontFamily.value,
                fontSize: parseInt(inputs.fontSize.value),
                backgroundEffect: inputs.backgroundEffect.value,
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || error.errors?.join(', ') || 'Failed to create message');
        }

        const data = await response.json();

        // Show success modal
        shareLink.value = data.shareUrl;
        successModal.classList.add('active');
        showToast('Message created successfully! 🎉');

        // Reset form
        messageForm.reset();
        charCount.textContent = '0/500';
        charFill.style.width = '0%';
        updatePreview();
        customizationOptions.classList.remove('active');
        toggleCustomization.classList.remove('active');

    } catch (error) {
        showToast(`Error: ${error.message}`);
        playHaptic('light');
    } finally {
        createBtn.disabled = false;
        createBtn.innerHTML = 'Create & Share 🚀';
        createBtn.classList.remove('btn-loading');
    }
});

// ==================== MODAL FUNCTIONS ====================
function closeModal() {
    playHaptic('medium');
    playSound('click');
    successModal.classList.remove('active');
}

function copyToClipboard() {
    playHaptic('medium');
    playSound('copy');
    
    shareLink.select();
    document.execCommand('copy');
    
    showToast('Link copied! 📋');
}

// ==================== SOCIAL SHARING ====================
function shareOnWhatsApp() {
    playHaptic('light');
    const url = shareLink.value;
    const text = encodeURIComponent(`Check out this beautiful message! 💕\n\n${url}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
}

function shareOnTwitter() {
    playHaptic('light');
    const url = shareLink.value;
    const text = encodeURIComponent(`I just created a beautiful message with Blushy 🤭\n\n${url}`);
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
}

function shareOnFacebook() {
    playHaptic('light');
    const url = shareLink.value;
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
}

// ==================== CLOSE MODAL ON OUTSIDE CLICK ====================
window.addEventListener('click', (e) => {
    if (e.target === successModal) {
        closeModal();
    }
});

// ==================== KEYBOARD SHORTCUTS ====================
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + Enter to submit
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        if (document.activeElement === messageText) {
            messageForm.dispatchEvent(new Event('submit'));
        }
    }
});

// ==================== INITIAL PREVIEW ====================
updatePreview();

// ==================== ACCESSIBILITY & UX ====================
document.addEventListener('DOMContentLoaded', () => {
    // Add smooth scroll behavior
    document.documentElement.style.scrollBehavior = 'smooth';

    // Add focus visible styles for accessibility
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
            document.body.classList.add('keyboard-nav');
        }
    });

    // Show toast on page load
    showToast('Welcome to Blushy! 🤭', 2000);
});
