import { reactive } from 'vue';

export const chatStore = reactive({
    chatUnread: 0,
    systemUnread: 0,
    totalUnread: 0,

    setUnread(count) {
        this.chatUnread = Number(count) || 0;
        this.refreshTotal();
    },

    incrementUnread(num = 1) {
        this.chatUnread += num;
        this.refreshTotal();
    },

    decrementUnread(num = 1) {
        this.chatUnread = Math.max(0, this.chatUnread - num);
        this.refreshTotal();
    },

    setSystemUnread(count) {
        this.systemUnread = Number(count) || 0;
        this.refreshTotal();
    },

    incrementSystemUnread(num = 1) {
        this.systemUnread += num;
        this.refreshTotal();
    },

    decrementSystemUnread(num = 1) {
        this.systemUnread = Math.max(0, this.systemUnread - num);
        this.refreshTotal();
    },

    refreshTotal() {
        this.totalUnread = Math.max(0, (Number(this.chatUnread) || 0) + (Number(this.systemUnread) || 0));
    }
});
