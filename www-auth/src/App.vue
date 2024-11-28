<template>
  <Card
    class="w-[370px] mx-auto"
    :pt="{ content: { class: 'flex flex-col' } }">
    <input
      v-model="csrfToken"
      type="hidden"
      name="csrf_token"
      value="....">
    <template
      #title>
      <span class="font-bold">
        Log in
      </span>
    </template>

    <template #content>
      <div class="text-red-600 mb-6">
        <span v-if="errorMessage">
          {{ errorMessage }}
        </span>
      </div>

      <form @keypress="handleFormKeyPress">
        <div class="flex flex-col items-start mb-6">
          <label
            for="email"
            class="mb-2">
            Email
          </label>
          <InputText
            id="email"
            v-model="email"
            :invalid="!!errors.email"
            class="w-full !bg-white !text-zinc-900"
            type="email"
            placeholder="Please enter your email" />
          <span class="text-red-600">
            {{ errors.email }}
          </span>
        </div>

        <div class="flex flex-col items-start mb-8">
          <label
            for="password"
            class="mb-2">
            Password
          </label>
          <Password
            v-model="password"
            :invalid="!!errors.password"
            :feedback="false"
            class="w-full"
            placeholder="Please enter your password"
            toggle-mask
            :pt="{ pcInput: { class: '!bg-white !text-zinc-900' } }" />
          <span class="text-red-600">
            {{ errors.password }}
          </span>
        </div>

        <Button
          label="Log in"
          :pt="{ label: { class: '!font-bold' } }"
          :loading="loading"
          @click="submit" />
      </form>
    </template>
  </Card>
</template>

<script setup lang="ts">
import axios from 'axios';
import { onMounted, Ref, ref } from 'vue';
import { useForm } from 'vee-validate';
import * as yup from 'yup';

const {
  errors, meta, validate, defineField,
} = useForm({
  validationSchema: yup.object({
    email: yup.string().email().required(),
    password: yup.string().required(),
  }),
});

const [email] = defineField('email');
const [password] = defineField('password');

const loading: Ref<boolean> = ref(false);
const errorMessage: Ref<string> = ref('');
const csrfToken: Ref<string> = ref('');
const flowId: Ref<string> = ref('');

const submit = async () => {
  try {
    loading.value = true;
    errorMessage.value = '';
    await validate();
    if (meta.value.valid) {
      await axios.post(`/api/v1/auth/login/${flowId.value}`, {
        csrfToken: csrfToken.value,
        email: email.value,
        password: password.value,
      });
    }
  } catch (error: any) {
    switch (error.response.status) {
      case 400:
        errorMessage.value = 'An error occured while trying to login. Check for spelling errors in your email and password.';
        break;
      case 422:
      default:
        window.location.href = error.response.data.redirect_browser_to;
        break;
    }
  } finally {
    loading.value = false;
  }
};

const handleFormKeyPress = async (event: KeyboardEvent) => {
  if (event.code === 'Enter') {
    await submit();
  }
};

onMounted(async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const loginChallenge = urlParams.get('login_challenge');
  const consentChallenge = urlParams.get('consent_challenge');
  if (loginChallenge) {
    const response = await axios.get(`/api/v1/auth/login?login_challenge=${loginChallenge}`);
    if (response.data.redirect_to) {
      window.location.href = response.data.redirect_to;
    } else {
      csrfToken.value = response.data.csrfToken;
      flowId.value = response.data.id;
    }
  } else if (consentChallenge) {
    const response = await axios.get(`/api/v1/auth/consent?consent_challenge=${consentChallenge}`);
    flowId.value = response.data.id;
    window.location.href = response.data.redirect_to;
  }
});
</script>

<style>
.p-password-input{
 width: 100%;
 background-color: white !important;
 color: #18181b !important;
}
</style>
