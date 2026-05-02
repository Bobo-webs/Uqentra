// CONTACT.JS

emailjs.init("OgxZ1n9_a_mMTXujH");

document.addEventListener('DOMContentLoaded', () => {
    const contactForm = document.getElementById('contactForm');

    if (!contactForm) return;

    contactForm.addEventListener('submit', function (e) {
        e.preventDefault();

        showToast("Sending your message...", "info");

        const templateParams = {
            name: document.getElementById('name').value.trim(),
            email: document.getElementById('email').value.trim(),
            phone: document.getElementById('phone').value.trim()||'Not provided',
            subject: document.getElementById('subject').value.trim(),
            message: document.getElementById('message').value.trim()
        };

        emailjs.send('service_7wwif5c', 'template_h01gp3q', templateParams)
            .then(() => {
                showToast("Message sent successfully!", "success");
                contactForm.reset();
            })
            .catch((error) => {
                console.error('EmailJS error:', error);
                showToast("Failed to send message. Try again.", "error");
            });
    });
});