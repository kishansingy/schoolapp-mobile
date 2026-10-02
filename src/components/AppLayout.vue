<template>
  <ion-page>
    <!-- Header -->
    <div class="app-header" :style="`background: ${headerGradient}`">
      <ion-menu-button menu="main-menu" class="menu-toggle-btn">
        <div class="hamburger">
          <span></span><span></span><span></span>
        </div>
      </ion-menu-button>
      <div class="header-center">
        <div class="header-title">{{ title }}</div>
      </div>
      <div class="header-right">
        <slot name="header-right">
          <div class="notif-btn">🔔</div>
        </slot>
      </div>
    </div>

    <!-- Page content -->
    <ion-content class="page-content">
      <slot />
    </ion-content>
  </ion-page>
</template>

<script setup>
import { IonPage, IonContent, IonMenuButton } from '@ionic/vue'

defineProps({
  title:          { type: String, default: 'Dashboard' },
  headerGradient: { type: String, default: 'linear-gradient(90deg,#1b6ca8,#00b4d8)' },
})
</script>

<style scoped>
.app-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 44px 16px 14px; position: sticky; top: 0; z-index: 100;
  box-shadow: 0 2px 12px rgba(0,0,0,.15);
}
.menu-toggle-btn {
  --color: #fff;
  width: 40px; height: 40px;
  display: flex; align-items: center; justify-content: center;
}
.hamburger { display: flex; flex-direction: column; gap: 5px }
.hamburger span { display: block; width: 22px; height: 2px; background: #fff; border-radius: 2px }
.header-center { flex: 1; text-align: center }
.header-title  { font-size: 18px; font-weight: 700; color: #fff }
.header-right  { width: 40px; display: flex; justify-content: flex-end }
.notif-btn     { background: rgba(255,255,255,.2); border: none; border-radius: 50%; width: 36px; height: 36px; font-size: 16px; display: flex; align-items: center; justify-content: center; cursor: pointer }
.page-content  { --background: #f0f4f8 }
</style>
