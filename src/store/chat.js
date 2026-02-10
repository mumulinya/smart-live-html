import { reactive } from 'vue';

export const chatStore = reactive({
    totalUnread: 0,

    setUnread(count) {
        this.totalUnread = count;
    },

    incrementUnread(num = 1) {
        this.totalUnread += num;
    },

    decrementUnread(num = 1) {
        this.totalUnread = Math.max(0, this.totalUnread - num);
    }
});
