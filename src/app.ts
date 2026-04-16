// Tipos básicos
interface RegistrationData {
    personal: any;
    address: any;
    bank: any;
}

document.addEventListener('DOMContentLoaded', () => {
    // Referencias a elementos
    const regForm = document.getElementById('registration-form') as HTMLFormElement;
    const loginForm = document.getElementById('login-form') as HTMLFormElement;
    
    // Pasos del registro
    let currentStep = 1;
    const totalSteps = 2;

    const nextBtn = document.getElementById('next-btn');
    const prevBtn = document.getElementById('prev-btn');
    const submitRegBtn = document.getElementById('submit-reg-btn');

    // Manejo de Pasos
    function updateSteps() {
        for (let i = 1; i <= totalSteps; i++) {
            const stepEl = document.getElementById(`step-${i}`);
            const nodeEl = document.getElementById(`step-node-${i}`);
            
            if (i === currentStep) {
                stepEl?.classList.remove('hidden');
                nodeEl?.classList.add('active');
            } else {
                stepEl?.classList.add('hidden');
                nodeEl?.classList.remove('active');
            }
        }

        // Visibilidad botones
        if (currentStep === 1) {
            prevBtn?.classList.add('hidden');
        } else {
            prevBtn?.classList.remove('hidden');
        }

        if (currentStep === totalSteps) {
            nextBtn?.classList.add('hidden');
            submitRegBtn?.classList.remove('hidden');
        } else {
            nextBtn?.classList.remove('hidden');
            submitRegBtn?.classList.add('hidden');
        }
    }

    nextBtn?.addEventListener('click', () => {
        if (currentStep < totalSteps) {
            currentStep++;
            updateSteps();
        }
    });

    prevBtn?.addEventListener('click', () => {
        if (currentStep > 1) {
            currentStep--;
            updateSteps();
        }
    });

    // Envío del Registro
    regForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const data: any = {
            personal: {
                nombre: (document.getElementById('nombre') as HTMLInputElement).value,
                email: (document.getElementById('email') as HTMLInputElement).value,
                password: (document.getElementById('password') as HTMLInputElement).value,
                telefono: (document.getElementById('telefono') as HTMLInputElement).value
            },
            address: {
                calle: (document.getElementById('calle') as HTMLInputElement).value,
                ciudad: (document.getElementById('ciudad') as HTMLInputElement).value,
                zip: (document.getElementById('zip') as HTMLInputElement).value,
                provincia: (document.getElementById('provincia') as HTMLInputElement).value
            }
        };

        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            const result = await response.json();
            if (result.success) {
                alert('¡Registro completado con éxito! Ahora puedes iniciar sesión.');
                window.location.href = '/login.html';
            } else {
                alert('Error: ' + result.error);
            }
        } catch (error) {
            console.error('Error en el registro:', error);
            alert('Error conectando con el servidor.');
        }
    });

    // Envío del Login
    loginForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = (document.getElementById('login-email') as HTMLInputElement).value;
        const password = (document.getElementById('login-password') as HTMLInputElement).value;

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const result = await response.json();
            if (result.success) {
                alert(`Bienvenido, ${result.user.nombre}`);
                // Aquí podrías redirigir a un dashboard o cargar las preguntas
                console.log('User logged in:', result.user);
            } else {
                alert('Error: ' + result.error);
            }
        } catch (error) {
            alert('Error en el inicio de sesión.');
        }
    });
});
