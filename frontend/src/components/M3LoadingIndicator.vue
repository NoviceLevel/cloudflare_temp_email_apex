<template>
  <div class="m3-loading-container">
    <div class="indicator-container">
      <div class="shape"></div>
    </div>
  </div>
</template>

<style scoped>
.m3-loading-container {
  display: flex;
  align-items: center;
  justify-content: center;
}

.indicator-container {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background-color: var(--container-color, #E8DEF8);
  display: flex;
  align-items: center;
  justify-content: center;
}

.shape {
  width: 32px;
  height: 32px;
  background-color: var(--indicator-color, #6750A4);
  animation: morph 2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
}

@keyframes morph {
  0%, 100% {
    border-radius: 50%;
    transform: rotate(0deg) scale(1);
  }
  25% {
    border-radius: 30% 70% 70% 30% / 30% 30% 70% 70%;
    transform: rotate(90deg) scale(0.95);
  }
  50% {
    border-radius: 50% 20% 50% 20%;
    transform: rotate(180deg) scale(1);
  }
  75% {
    border-radius: 20% 50% 20% 50%;
    transform: rotate(270deg) scale(0.95);
  }
}

/* 浅色主题 */
:root:not(.v-theme--dark) .indicator-container {
  --container-color: #E8DEF8;
}
:root:not(.v-theme--dark) .shape {
  --indicator-color: #6750A4;
}

/* 深色主题 */
:root.v-theme--dark .indicator-container,
.v-theme--dark .indicator-container {
  --container-color: #4A4458;
}
:root.v-theme--dark .shape,
.v-theme--dark .shape {
  --indicator-color: #D0BCFF;
}
</style>
