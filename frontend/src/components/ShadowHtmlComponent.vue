<template>
    <div v-if="useFallback" v-html="htmlContent"></div>
    <div v-else ref="shadowHost"></div>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue';

const props = defineProps({
    htmlContent: {
        type: String,
        required: true,
    },
});

const shadowHost = ref(null);
let shadowRoot = null;
const useFallback = ref(false);

const renderShadowDom = () => {
    if (!shadowHost.value && !useFallback.value) return;

    try {
        if (useFallback.value) return;

        if (!shadowRoot && shadowHost.value) {
            try {
                shadowRoot = shadowHost.value.attachShadow({ mode: 'open' });
            } catch (error) {
                console.warn('Shadow DOM not supported, falling back to v-html:', error);
                useFallback.value = true;
                return;
            }
        }

        if (shadowRoot) {
            shadowRoot.innerHTML = props.htmlContent;
        }
    } catch (error) {
        console.error('Failed to render Shadow DOM, falling back to v-html:', error);
        useFallback.value = true;
    }
};

onMounted(() => {
    if (typeof Element.prototype.attachShadow !== 'function') {
        console.warn('Shadow DOM is not supported in this browser, using v-html fallback');
        useFallback.value = true;
        return;
    }
    renderShadowDom();
});

onBeforeUnmount(() => {
    if (shadowRoot) {
        shadowRoot.innerHTML = '';
    }
    shadowRoot = null;
});

watch(() => props.htmlContent, () => {
    renderShadowDom();
}, { flush: 'post' });
</script>
