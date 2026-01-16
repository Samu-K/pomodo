<script setup lang="ts">
import {
	AlertCircle,
	ChevronLeft,
	KeyRound,
	Loader2,
	Mail
} from "lucide-vue-next";
import { computed, ref } from "vue";

import { useRouter } from "vue-router";
import { useAuthStore } from "../../stores/auth";

const router = useRouter();
const authStore = useAuthStore();

const isLogin = ref(true);
const transitionName = ref("slide-left");

const email = ref("");
const password = ref("");
const isLoading = ref(false);
const error = ref<string | null>(null);

const handleBack = () => {
	if (!isLogin.value) {
		transitionName.value = "slide-right";
		isLogin.value = true;
	} else {
		router.back();
	}
};

const goToSignup = () => {
	transitionName.value = "slide-left";
	isLogin.value = false;
};

const showConfirmation = ref(false);

const handleSubmit = async () => {
	if (!email.value || !password.value) {
		error.value = "Please fill in all fields";
		return;
	}

	isLoading.value = true;
	error.value = null;

	try {
		if (isLogin.value) {
			await authStore.login(email.value, password.value);
			router.back();
		} else {
			const sess = await authStore.signup(email.value, password.value);
			if (sess) {
				router.back();
			} else {
				// No session = confirmation needed
				showConfirmation.value = true;
			}
		}
	} catch (e: any) {
		console.error(e);
		error.value = getFriendlyErrorMessage(e);
	} finally {
		isLoading.value = false;
	}
};

function getFriendlyErrorMessage(err: any): string {
	const str = err.toString();

	// Try to extract JSON from the error string (Supabase errors often come as JSON strings)
	// Matches content between first { and last }
	const jsonMatch = str.match(/\{.*\}/);
	if (jsonMatch) {
		try {
			const parsed = JSON.parse(jsonMatch[0]);
			if (parsed.error_code === "invalid_credentials") {
				return "Invalid email or password.";
			}
			if (parsed.msg) return parsed.msg;
			if (parsed.message) return parsed.message;
			if (parsed.error_description) return parsed.error_description;
		} catch (e) {
			// Failed to parse JSON, fall back to string
		}
	}

	// Common fallback cleanups
	if (str.includes("Login failed: ")) {
		return str
			.replace("Error: Login failed: ", "")
			.replace("Login failed: ", "");
	}

	return str; // Default to raw string if processing fails
}

const themeClasses = computed(() =>
	isLogin.value
		? {
				gradient: "from-pomodo-orange to-pomodo-red",
				text: "text-pomodo-orange",
				hoverText: "hover:text-pomodo-orange",
				border: "focus:border-pomodo-orange",
				shadow: "shadow-pomodo-orange/20"
			}
		: {
				gradient: "from-blue-500 to-indigo-600",
				text: "text-blue-500",
				hoverText: "hover:text-blue-500",
				border: "focus:border-blue-500",
				shadow: "shadow-blue-500/20"
			}
);
</script>

<template>
  <div class="flex flex-col h-full bg-light-bg dark:bg-dark-bg relative overflow-hidden">
    <!-- Header -->

    <div class="flex items-center gap-2 px-6 py-4 border-b border-light-border dark:border-dark-border z-10 bg-light-bg dark:bg-dark-bg relative">
      <button 
        @click="handleBack"
        class="w-8 h-8 flex items-center justify-center hover:bg-light-surface dark:hover:bg-dark-surface rounded-lg transition-colors"
        :class="themeClasses.text"
      >
        <ChevronLeft :size="24" />
      </button>


      <h1 class="text-xl font-bold text-lightText-primary dark:text-white">Cloud Sync</h1>
    </div>

    <!-- Content -->
    <div class="flex-1 relative overflow-hidden">
      <Transition :name="transitionName">
      <div :key="isLogin ? 'login' : 'signup'" class="absolute inset-0 flex items-center justify-center p-6">
      <div class="w-full max-w-sm">

        
        <div class="mb-8 text-center" v-if="showConfirmation">
           <div 
            class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-pomodo-green/10 mb-4 shadow-lg shadow-pomodo-green/20"
          >
             <Mail :size="32" class="text-pomodo-green" />
          </div>
          <h2 class="text-2xl font-bold text-lightText-primary dark:text-white mb-2">Check Your Email</h2>
           <p class="text-sm text-lightText-muted dark:text-text-muted">
            We've sent a confirmation link to <strong>{{ email }}</strong>. Please click it to verify your account.
          </p>
          <div class="mt-6">
             <button 
                @click="router.back()"
                class="text-sm font-bold text-pomodo-orange hover:text-pomodo-red transition-colors"
             >
                Back to Login
             </button>
          </div>
        </div>
        
        <div class="mb-8 text-center" v-else>
          <div 
            class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br mb-4 shadow-lg transition-all duration-500"
            :class="[themeClasses.gradient, themeClasses.shadow]"
          >
             <KeyRound :size="32" class="text-white" />
          </div>
          <h2 class="text-2xl font-bold text-lightText-primary dark:text-white mb-2">
            {{ isLogin ? "Welcome Back" : "Create Account" }}
          </h2>
          <p class="text-sm text-lightText-muted dark:text-text-muted">
            {{ isLogin ? "Sign in to sync your data across devices." : "Sign up to start backing up your progress." }}
          </p>
        </div>

        <form v-if="!showConfirmation" @submit.prevent="handleSubmit" class="space-y-4">

          <!-- Error Alert -->
          <div v-if="error" class="p-3 rounded-lg bg-pomodo-red/10 border border-pomodo-red/20 flex items-center gap-2 text-sm text-pomodo-red">
            <AlertCircle :size="16" />
            <span>{{ error }}</span>
          </div>

          <div class="space-y-1">
            <label class="text-xs font-semibold text-lightText-muted dark:text-text-muted uppercase tracking-wider ml-1">Email</label>
            <div class="relative">
              <Mail :size="18" class="absolute left-3 top-1/2 -translate-y-1/2 text-lightText-muted dark:text-text-muted" />
              <input 
                v-model="email"
                type="email" 
                placeholder="name@example.com"
                class="w-full pl-10 pr-4 py-2.5 bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-lg text-lightText-primary dark:text-white placeholder:text-lightText-muted/50 dark:placeholder:text-text-muted/50 focus:outline-none transition-colors"
                :class="themeClasses.border"
              />

            </div>
          </div>

          <div class="space-y-1">
            <label class="text-xs font-semibold text-lightText-muted dark:text-text-muted uppercase tracking-wider ml-1">Password</label>
            <div class="relative">
              <KeyRound :size="18" class="absolute left-3 top-1/2 -translate-y-1/2 text-lightText-muted dark:text-text-muted" />
              <input 
                v-model="password"
                type="password" 
                placeholder="••••••••"
                class="w-full pl-10 pr-4 py-2.5 bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-lg text-lightText-primary dark:text-white placeholder:text-lightText-muted/50 dark:placeholder:text-text-muted/50 focus:outline-none transition-colors"
                :class="themeClasses.border"
              />

            </div>
          </div>

          <button 
            type="submit"
            :disabled="isLoading"
            class="w-full py-3 bg-gradient-to-r text-white font-bold rounded-lg shadow-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 duration-500"
            :class="[themeClasses.gradient, themeClasses.shadow]"
          >

            <Loader2 v-if="isLoading" :size="20" class="animate-spin" />
            <span>{{ isLogin ? "Sign In" : "Create Account" }}</span>
          </button>
        </form>

        <div class="mt-6 text-center h-5">
          <button 
            v-if="isLogin"
            @click="goToSignup"
            class="text-sm text-lightText-muted dark:text-text-muted transition-colors"
            :class="themeClasses.hoverText"
          >

            Don't have an account? Sign up
          </button>
        </div>
      </div>
      </div>
      </Transition>
    </div>
  </div>
</template>

<style scoped>
.slide-left-enter-active,
.slide-left-leave-active,
.slide-right-enter-active,
.slide-right-leave-active {
  transition: all 0.3s ease-out;
}

.slide-left-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.slide-left-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}

.slide-right-enter-from {
  opacity: 0;
  transform: translateX(-30px);
}

.slide-right-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
</style>

