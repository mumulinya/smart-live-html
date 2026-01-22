import { createRouter, createWebHistory } from 'vue-router'

const routes = [
    // Core
    {
        path: '/',
        name: 'Home',
        component: () => import('@/views/home/Index.vue'),
        meta: { keepAlive: true }
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
        path: '/ai',
        name: 'AI',
        component: () => import('@/views/ai/index.vue')
    },

    // User Module
    {
        path: '/user/login',
        name: 'Login',
        component: () => import('@/views/user/Login.vue')
    },
    {
        path: '/user/profile',
        name: 'UserProfile',
        alias: ['/info', '/user/info'], // Backward compatibility
        component: () => import('@/views/user/Info.vue')
    },
    {
        path: '/user/profile/:id',
        name: 'OtherProfile',
        alias: '/user-info/:id', // Backward compatibility
        component: () => import('@/views/user/OtherInfo.vue')
    },
    {
        path: '/user/edit',
        name: 'UserEdit',
        component: () => import('@/views/user/Edit.vue')
    },
    {
        path: '/user/add-friend',
        name: 'AddFriend',
        component: () => import('@/views/user/AddFriend.vue')
    },
    {
        path: '/user/star',
        name: 'UserStar',
        component: () => import('@/views/user/MyStar.vue')
    },
    {
        path: '/user/follow',
        name: 'MyFollow',
        component: () => import('@/views/user/MyFollow.vue')
    },
    {
        path: '/user/list',
        name: 'UserList',
        component: () => import('@/views/user/UserList.vue'),
        props: route => ({ type: route.query.type })
    },
    {
        path: '/user/moments',
        name: 'MyMoments',
        component: () => import('@/views/user/MyMoments.vue')
    },
    {
        path: '/user/password/update',
        name: 'UpdatePassword',
        component: () => import('@/views/user/UpdatePassword.vue')
    },
    {
        path: '/user/password/set',
        name: 'SetPassword',
        component: () => import('@/views/user/SetPassword.vue')
    },

    // Shop Module
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

    // Blog Module
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

    // Trade (Order/Voucher) Module
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
        path: '/voucher/detail',
        name: 'VoucherDetail',
        component: () => import('@/views/voucher/Detail.vue')
    },

    // Social (Chat/Comment) Module
    {
        path: '/chat/list',
        name: 'ChatList',
        component: () => import('@/views/chat/List.vue')
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
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

export default router
