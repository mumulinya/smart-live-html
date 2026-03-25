import { createRouter, createWebHistory } from 'vue-router'

const routes = [
    // Core
    {
        path: '/',
        name: 'Home',
        component: () => import('@/views/home/Index.vue'),
        meta: {
            keepAliveViewName: 'HomeIndex',
            keepAliveFor: ['ShopList', 'ShopDetail', 'ProductDetail', 'BlogDetail', 'TopShops', 'ProductTopList', 'DealList', 'Search']
        }
    },
    {
        path: '/search',
        name: 'Search',
        component: () => import('@/views/search/Index.vue'),
        meta: {
            keepAliveViewName: 'SearchIndex',
            keepAliveScrollEl: '.search-page',
            keepAliveFor: ['ShopDetail', 'ProductDetail', 'BlogDetail', 'OtherProfile', 'UserProfile']
        }
    },
    {
        path: '/search/user',
        name: 'UserSearch',
        component: () => import('@/views/search/UserSearch.vue'),
        meta: {
            keepAliveFor: ['BlogDetail', 'ShopDetail', 'ProductDetail']
        }
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
        component: () => import('@/views/user/auth/Login.vue')
    },
    {
        path: '/user/profile',
        name: 'UserProfile',
        alias: ['/info', '/user/info'],
        component: () => import('@/views/user/profile/Info.vue'),
        meta: {
            keepAliveViewName: 'UserInfo',
            keepAliveFor: ['BlogDetail', 'ShopDetail', 'ProductDetail', 'OtherProfile', 'UserEdit', 'UserList', 'UserSearch', 'MyFollow', 'MyInteractions', 'MyReviews', 'Drafts', 'OrderList', 'UserWallet', 'UserPoints', 'MyMoments', 'AddFriend']
        }
    },
    {
        path: '/user/profile/:id',
        name: 'OtherProfile',
        alias: '/user-info/:id',
        component: () => import('@/views/user/profile/OtherInfo.vue'),
        meta: {
            keepAliveViewName: 'OtherInfo',
            keepAliveFor: ['BlogDetail', 'ShopDetail', 'ProductDetail', 'UserList', 'OtherProfile', 'UserProfile']
        }
    },
    {
        path: '/user/edit',
        name: 'UserEdit',
        component: () => import('@/views/user/profile/Edit.vue')
    },
    {
        path: '/user/add-friend',
        name: 'AddFriend',
        component: () => import('@/views/user/social/AddFriend.vue')
    },
    {
        path: '/user/star',
        name: 'UserStar',
        component: () => import('@/views/user/content/MyStar.vue'),
        meta: {
            keepAliveViewName: 'MyStar',
            keepAliveFor: ['BlogDetail', 'ShopDetail', 'ProductDetail', 'OtherProfile', 'UserProfile']
        }
    },
    {
        path: '/user/follow',
        name: 'MyFollow',
        component: () => import('@/views/user/social/MyFollow.vue'),
        meta: {
            keepAliveFor: ['ShopDetail', 'ProductDetail', 'OtherProfile', 'UserProfile']
        }
    },
    {
        path: '/user/interactions',
        name: 'MyInteractions',
        component: () => import('@/views/user/social/MyInteractions.vue'),
        meta: {
            keepAliveFor: ['BlogDetail', 'ReviewDetail', 'ShopDetail', 'ProductDetail', 'OtherProfile', 'UserProfile']
        }
    },
    {
        path: '/review/mine',
        name: 'MyReviews',
        component: () => import('@/views/review/MyReviews.vue'),
        meta: {
            keepAliveFor: ['ReviewDetail', 'ReviewPublish']
        }
    },
    {
        path: '/review/drafts',
        name: 'MyDrafts',
        component: () => import('@/views/review/Drafts.vue')
    },
    {
        path: '/drafts',
        name: 'Drafts',
        component: () => import('@/views/draft/Index.vue'),
        meta: {
            keepAliveFor: ['ReviewPublish', 'BlogEdit']
        }
    },
    {
        path: '/user/my-reviews',
        redirect: '/review/mine'
    },
    {
        path: '/user/list',
        name: 'UserList',
        component: () => import('@/views/user/social/UserList.vue'),
        props: route => ({ type: route.query.type }),
        meta: {
            keepAliveFor: ['OtherProfile', 'UserProfile']
        }
    },
    {
        path: '/user/moments',
        name: 'MyMoments',
        component: () => import('@/views/user/content/MyMoments.vue'),
        meta: {
            keepAliveFor: ['BlogDetail', 'ProductDetail', 'OtherProfile', 'UserProfile']
        }
    },
    {
        path: '/user/password/update',
        name: 'UpdatePassword',
        component: () => import('@/views/user/auth/UpdatePassword.vue')
    },
    {
        path: '/user/password/set',
        name: 'SetPassword',
        component: () => import('@/views/user/auth/SetPassword.vue')
    },
    {
        path: '/user/wallet',
        name: 'UserWallet',
        component: () => import('@/views/user/wallet/Index.vue')
    },
    {
        path: '/user/wallet/recharge',
        name: 'UserWalletRecharge',
        component: () => import('@/views/user/wallet/Recharge.vue')
    },
    {
        path: '/user/wallet/bill',
        name: 'UserWalletBill',
        component: () => import('@/views/user/wallet/Bill.vue')
    },
    {
        path: '/user/wallet/payment-record',
        name: 'PaymentRecord',
        component: () => import('@/views/user/wallet/PaymentRecord.vue')
    },
    {
        path: '/pay/checkout',
        name: 'PayCheckout',
        component: () => import('@/views/pay/Checkout.vue')
    },
    {
        path: '/pay/result',
        name: 'PayResult',
        component: () => import('@/views/pay/Result.vue')
    },
    {
        path: '/user/points',
        name: 'UserPoints',
        component: () => import('@/views/user/points/Index.vue')
    },
    {
        path: '/user/points/detail',
        name: 'UserPointsDetail',
        component: () => import('@/views/user/points/Detail.vue')
    },
    {
        path: '/user/points/lottery',
        name: 'UserPointsLottery',
        component: () => import('@/views/user/points/Lottery.vue')
    },

    // Shop Module
    {
        path: '/shop/list',
        name: 'ShopList',
        component: () => import('@/views/shop/List.vue'),
        meta: { keepAliveFor: ['ShopDetail'], keepAliveScrollEl: '.shop-list-content' }
    },
    {
        path: '/shop/top',
        name: 'TopShops',
        component: () => import('@/views/shop/TopList.vue'),
        meta: {
            keepAliveViewName: 'TopList',
            keepAliveScrollEl: '.top-list-content',
            keepAliveFor: ['ShopDetail']
        }
    },
    {
        path: '/shop/detail',
        name: 'ShopDetail',
        component: () => import('@/views/shop/Detail.vue'),
        meta: { keepAliveFor: ['ProductDetail', 'ReviewDetail', 'ReviewPublish', 'OtherProfile', 'UserProfile'] }
    },
    {
        path: '/product/top',
        name: 'ProductTopList',
        component: () => import('@/views/product/TopList.vue'),
        meta: {
            keepAliveViewName: 'TopList',
            keepAliveScrollEl: '.top-list-content',
            keepAliveFor: ['ProductDetail']
        }
    },

    // Blog Module
    {
        path: '/blog/detail',
        name: 'BlogDetail',
        component: () => import('@/views/blog/Detail.vue'),
        meta: {
            keepAliveFor: ['ShopDetail', 'ReviewDetail', 'BlogEdit']
        }
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
        component: () => import('@/views/order/List.vue'),
        meta: {
            keepAliveFor: ['OrderDetail', 'ReviewPublish', 'ReviewDetail', 'PayCheckout']
        }
    },
    {
        path: '/order/detail',
        name: 'OrderDetail',
        component: () => import('@/views/order/Detail.vue'),
        meta: {
            keepAliveFor: ['ReviewPublish', 'PayCheckout']
        }
    },
    {
        path: '/product/detail',
        name: 'ProductDetail',
        component: () => import('@/views/product/Detail.vue'),
        meta: {
            keepAliveFor: ['ShopDetail', 'OrderDetail', 'ReviewDetail', 'OtherProfile', 'UserProfile']
        }
    },
    {
        path: '/deal/list',
        name: 'DealList',
        component: () => import('@/views/deal/Index.vue'),
        meta: {
            keepAliveViewName: 'DealListIndex',
            keepAliveScrollEl: '.deal-list',
            keepAliveFor: ['ProductDetail']
        }
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
        path: '/chat/info',
        name: 'ChatInfo',
        component: () => import('@/views/chat/ChatInfo.vue')
    },
    {
        path: '/chat/system',
        name: 'SystemNotice',
        component: () => import('@/views/chat/SystemNotice.vue')
    },
    {
        path: '/chat/history-calendar',
        name: 'ChatHistoryCalendar',
        component: () => import('@/views/chat/ChatHistoryCalendar.vue')
    },
    {
        path: '/review/detail',
        name: 'ReviewDetail',
        component: () => import('@/views/review/Detail.vue')
    },
    {
        path: '/review/publish',
        name: 'ReviewPublish',
        component: () => import('@/views/review/Publish.vue')
    },
    {
        path: '/review/wait',
        name: 'WaitReview',
        component: () => import('@/views/review/WaitReview.vue')
    }
]

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes,
    scrollBehavior(to, from, savedPosition) {
        if (savedPosition) {
            return savedPosition;
        }

        const toAllowedChildren = Array.isArray(to.meta?.keepAliveFor)
            ? to.meta.keepAliveFor.map((name) => String(name))
            : [];
        const fromName = from?.name ? String(from.name) : '';

        // Back to an allowed parent list/detail route: keep current window scroll.
        if (fromName && toAllowedChildren.includes(fromName)) {
            return false;
        }

        if (to.path !== from.path) {
            return { top: 0 };
        }

        return false;
    }
})

export default router
