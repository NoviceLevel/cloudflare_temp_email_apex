<template>
  <div class="m3-loading-container">
    <div class="m3-loading-indicator">
      <svg class="active-indicator" viewBox="0 0 200 200">
        <path fill="currentColor">
          <animate 
            attributeName="d" 
            dur="2s" 
            repeatCount="indefinite"
            calcMode="spline"
            keyTimes="0; 0.25; 0.5; 0.75; 1"
            keySplines="0.4 0 0.2 1; 0.4 0 0.2 1; 0.4 0 0.2 1; 0.4 0 0.2 1"
            :values="morphValues"
          />
        </path>
      </svg>
    </div>
  </div>
</template>

<script setup>
// M3 Soft Burst - 8角软星形 (紧凑)
const burst1 = `
  M100,15 C110,40,120,40,140,25 C130,50,140,60,170,55 C155,75,160,85,190,95
  C160,105,155,115,170,140 C140,130,130,140,140,170 C120,155,110,155,100,180
  C90,155,80,155,60,170 C70,140,60,130,30,140 C45,115,40,105,10,95
  C40,85,45,75,30,55 C60,60,70,50,60,25 C80,40,90,40,100,15 Z
`

// M3 Soft Burst - 稍微旋转和缩放
const burst2 = `
  M100,20 C112,42,125,38,145,28 C132,52,145,65,172,58 C155,78,162,92,188,100
  C162,108,155,122,172,142 C145,135,132,148,145,172 C125,162,112,158,100,178
  C88,158,75,162,55,172 C68,148,55,135,28,142 C45,122,38,108,12,100
  C38,92,45,78,28,58 C55,65,68,52,55,28 C75,38,88,42,100,20 Z
`

// M3 Circle - 圆形
const circle = `
  M100,15 C147,15,185,53,185,100 C185,147,147,185,100,185 C53,185,15,147,15,100
  C15,53,53,15,100,15 Z
`

// M3 Soft Burst - 另一个变体
const burst3 = `
  M100,18 C108,38,118,42,138,30 C128,52,138,62,165,58 C152,76,158,88,182,98
  C158,108,152,120,165,138 C138,132,128,142,138,165 C118,152,108,158,100,178
  C92,158,82,152,62,165 C72,142,62,132,35,138 C48,120,42,108,18,98
  C42,88,48,76,35,58 C62,62,72,52,62,30 C82,42,92,38,100,18 Z
`

const morphValues = [burst1, burst2, circle, burst3, burst1].join(';')
</script>

<style scoped>
.m3-loading-container {
  display: flex;
  align-items: center;
  justify-content: center;
}

.m3-loading-indicator {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: rotate 4s linear infinite;
}

.active-indicator {
  width: 100%;
  height: 100%;
  color: var(--indicator-color, #0061A4);
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* 浅色主题 */
:root:not(.v-theme--dark) .active-indicator {
  --indicator-color: #0061A4;
}

/* 深色主题 */
:root.v-theme--dark .active-indicator,
.v-theme--dark .active-indicator {
  --indicator-color: #9ECAFF;
}
</style>
