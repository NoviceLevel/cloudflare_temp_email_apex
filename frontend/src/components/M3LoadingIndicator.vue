<template>
  <div class="m3-loading-container">
    <!-- 圆形容器背景 -->
    <div class="indicator-container">
      <svg class="active-indicator" viewBox="0 0 200 200">
        <path fill="currentColor">
          <animate 
            attributeName="d" 
            dur="1.8s" 
            repeatCount="indefinite"
            calcMode="spline"
            keyTimes="0; 0.14; 0.28; 0.42; 0.57; 0.71; 0.85; 1"
            keySplines="0.4 0 0.2 1; 0.4 0 0.2 1; 0.4 0 0.2 1; 0.4 0 0.2 1; 0.4 0 0.2 1; 0.4 0 0.2 1; 0.4 0 0.2 1"
            values="M100,20 C144,20 180,56 180,100 C180,144 144,180 100,180 C56,180 20,144 20,100 C20,56 56,20 100,20 Z;
                    M100,25 C130,25 165,50 170,85 C175,120 155,160 120,170 C85,180 45,160 35,125 C25,90 50,45 100,25 Z;
                    M100,20 C140,30 175,70 170,110 C165,150 130,180 90,175 C50,170 25,130 30,90 C35,50 60,25 100,20 Z;
                    M100,30 C120,30 140,50 140,70 C155,55 175,65 175,85 C175,105 155,120 140,115 C155,135 155,160 135,170 C115,180 95,170 90,150 C75,170 50,165 40,145 C30,125 45,105 60,110 C45,90 45,65 65,55 C85,45 100,30 100,30 Z;
                    M100,25 C120,35 145,30 160,50 C175,70 175,100 160,120 C175,140 165,170 140,175 C115,180 90,170 75,150 C55,170 30,160 25,135 C20,110 40,90 60,95 C45,75 50,45 75,35 C100,25 100,25 100,25 Z;
                    M100,30 C110,45 125,40 145,35 C140,55 155,65 175,70 C165,85 170,100 175,120 C155,115 145,130 150,155 C130,145 115,155 100,170 C85,155 70,145 50,155 C55,130 45,115 25,120 C30,100 35,85 25,70 C45,65 60,55 55,35 C75,40 90,45 100,30 Z;
                    M100,30 C125,35 145,30 160,50 C170,70 175,95 165,115 C175,135 165,160 140,165 C120,175 95,170 80,155 C60,170 35,160 30,135 C25,110 40,90 55,85 C40,65 50,40 75,35 C95,30 100,30 100,30 Z;
                    M100,20 C144,20 180,56 180,100 C180,144 144,180 100,180 C56,180 20,144 20,100 C20,56 56,20 100,20 Z"
          />
        </path>
      </svg>
    </div>
  </div>
</template>

<style scoped>
.m3-loading-container {
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 圆形容器背景 */
.indicator-container {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background-color: var(--container-color, #E8DEF8);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
}

.active-indicator {
  width: 40px;
  height: 40px;
  color: var(--indicator-color, #6750A4);
}

/* 浅色主题 */
:root:not(.v-theme--dark) .indicator-container {
  --container-color: #E8DEF8;
}

:root:not(.v-theme--dark) .active-indicator {
  --indicator-color: #6750A4;
}

/* 深色主题 */
:root.v-theme--dark .indicator-container,
.v-theme--dark .indicator-container {
  --container-color: #4A4458;
}

:root.v-theme--dark .active-indicator,
.v-theme--dark .active-indicator {
  --indicator-color: #D0BCFF;
}
</style>
