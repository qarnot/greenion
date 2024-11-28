import { createWebHistory, createRouter, RouteRecordRaw } from 'vue-router';
import MachinesPage from '../pages/MachinesPage.vue';
import SessionsPage from '../pages/SessionsPage.vue';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: () => ({ name: 'machines' }),
  },
  {
    name: 'machines',
    path: '/machines',
    component: MachinesPage,
  },
  {
    name: 'vdiSessions',
    path: '/vdi-sessions',
    component: SessionsPage,
  },
];

export default createRouter({
  history: createWebHistory(),
  routes,
});
