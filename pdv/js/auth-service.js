const AuthService = {
    // State
    currentUser: null,

    // Initialize Auth Listener
    init(callback) {
        auth.onAuthStateChanged(user => {
            if (user) {
                this.currentUser = user;
                console.log('User authenticated:', user.email);
                if (callback) callback(user);
            } else {
                this.currentUser = null;
                console.log('User signed out');
                if (callback) callback(null);
            }
        });
    },

    // Login with Email/Password
    async login(email, password) {
        try {
            const userCredential = await auth.signInWithEmailAndPassword(email, password);
            return { success: true, user: userCredential.user };
        } catch (error) {
            console.error('Login Error:', error);
            return { success: false, error: this.mapError(error.code) };
        }
    },

    // Login with Google
    async loginWithGoogle() {
        const provider = new firebase.auth.GoogleAuthProvider();
        try {
            const result = await auth.signInWithPopup(provider);
            return { success: true, user: result.user };
        } catch (error) {
            console.error('Google Login Error:', error);
            return { success: false, error: this.mapError(error.code) };
        }
    },

    // Register with Email/Password
    async register(email, password) {
        try {
            // Validate password strength
            if (!this.isStrongPassword(password)) {
                return { success: false, error: 'A senha deve ter pelo menos 8 caracteres, incluindo maiúsculas, minúsculas, números e símbolos.' };
            }

            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            return { success: true, user: userCredential.user };
        } catch (error) {
            console.error('Registration Error:', error);
            return { success: false, error: this.mapError(error.code) };
        }
    },

    // Password Reset
    async resetPassword(email) {
        try {
            await auth.sendPasswordResetEmail(email);
            return { success: true };
        } catch (error) {
            console.error('Reset Password Error:', error);
            return { success: false, error: this.mapError(error.code) };
        }
    },

    // Logout
    async logout() {
        try {
            await auth.signOut();
            return { success: true };
        } catch (error) {
            console.error('Logout Error:', error);
            return { success: false, error: error.message };
        }
    },

    // Helpers
    isStrongPassword(password) {
        // Min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
        const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        return regex.test(password);
    },

    mapError(code) {
        switch (code) {
            case 'auth/invalid-email': return 'Email inválido.';
            case 'auth/user-disabled': return 'Usuário desativado.';
            case 'auth/user-not-found': return 'Usuário não encontrado.';
            case 'auth/wrong-password': return 'Senha incorreta.';
            case 'auth/email-already-in-use': return 'Email já está em uso.';
            case 'auth/weak-password': return 'Senha muito fraca.';
            case 'auth/operation-not-allowed': return 'Operação não permitida. Contate o suporte.';
            case 'auth/popup-closed-by-user': return 'Login cancelado pelo usuário.';
            default: return 'Erro desconhecido. Tente novamente.';
        }
    }
};
