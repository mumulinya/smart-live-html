import { createRouter, createWebHistory } from 'vue-router'

const routes = [
    {
        path: '/',
        name: 'Home',
        component: () => import('@/views/home/Index.vue')
    },
    {
        path: '/user/login',
        name: 'Login',
        component: () => import('@/views/user/Login.vue')
    },
    {
        path: '/search',
        name: 'Search',
        component: () => import('@/views/search/Index.vue')
    },
    {
        path: '/map',
        name: 'Map',
        component: () => import('@/views/map/Index.vue')
    },
    {
        path: '/blog/detail',
        name: 'BlogDetail',
        component: () => import('@/views/blog/Detail.vue')
    },
    {
        path: '/blog/edit',
        name: 'BlogEdit',
        component: () => import('@/views/blog/Edit.vue')
    },
    {
        path: '/shop/list',
        name: 'ShopList',
        component: () => import('@/views/shop/List.vue')
    },
    {
        path: '/shop/detail',
        name: 'ShopDetail',
        component: () => import('@/views/shop/Detail.vue')
    },
    {
        path: '/info',
        alias: '/user/info',
        name: 'UserInfo',
        component: () => import('@/views/user/Info.vue')
    },
    {
        path: '/user-info/:id',
        name: 'OtherInfo',
        component: () => import('@/views/user/OtherInfo.vue')
    },
    {
        path: '/user/edit',
        name: 'UserEdit',
        component: () => import('@/views/user/Edit.vue')
    },
    {
        path: '/chat/list',
        name: 'ChatList',
        component: () => import('@/views/chat/List.vue')
    },
    {
        path: '/user/follows',
        name: 'Follows',
        component: () => import('@/views/user/UserList.vue'),
        props: { type: 'follow' }
    },
    {
        path: '/user/fans',
        name: 'Fans',
        component: () => import('@/views/user/UserList.vue'),
        props: { type: 'fans' }
    },
    {
        path: '/chat/detail',
        name: 'ChatDetail',
        component: () => import('@/views/chat/Detail.vue')
    },
    {
        path: '/comment/list',
        name: 'CommentList',
        component: () => import('@/views/comment/List.vue')
    },
    {
        path: '/order/list',
        name: 'OrderList',
        component: () => import('@/views/order/List.vue')
    },
    {
        path: '/order/detail',
        name: 'OrderDetail',
        component: () => import('@/views/order/Detail.vue')
    },
    {
        path: '/ai',
        name: 'AI',
        component: () => import('@/views/ai/index.vue')
    },
    {
        path: '/user/add-friend',
        name: 'AddFriend',
        component: () => import('@/views/user/AddFriend.vue')
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

export default router
