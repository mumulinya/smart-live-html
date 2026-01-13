<template>
  <div class="edit-page">
    <div class="header">
      <div class="header-back-btn" @click="goBack"><i class="el-icon-arrow-left"></i></div>
      <div class="header-title">资料编辑</div>
    </div>

    <div class="edit-container" v-loading="loading">
      <!-- Basic Info -->
      <div class="info-box">
        <div class="info-item" @click="triggerUpload">
          <div class="info-label">头像</div>
          <div class="info-btn">
            <img :src="user.icon || '/imgs/icons/default-icon.png'" alt="">
            <div><i class="el-icon-arrow-right"></i></div>
          </div>
        </div>
        <div class="divider"></div>
        <div class="info-item" @click="showNickNameDialog = true">
          <div class="info-label">昵称</div>
          <div class="info-btn">
            <div>{{user.nickName || '未设置'}}</div>
            <div><i class="el-icon-arrow-right"></i></div>
          </div>
        </div>
        <div class="divider"></div>
        <div class="info-item" @click="showIntroduceDialog = true">
          <div class="info-label">个人介绍</div>
          <div class="info-btn">
            <div class="text-truncate">{{info.introduce || '介绍一下自己'}}</div>
            <div><i class="el-icon-arrow-right"></i></div>
          </div>
        </div>
      </div>

      <!-- Detail Info -->
      <div class="info-box">
        <div class="info-item" @click="showGenderDialog = true">
          <div class="info-label">性别</div>
          <div class="info-btn">
            <div>{{genderText}}</div>
            <div><i class="el-icon-arrow-right"></i></div>
          </div>
        </div>
        <div class="divider"></div>
        <div class="info-item" @click="showCityDialog = true">
          <div class="info-label">城市</div>
          <div class="info-btn">
            <div>{{info.city || '选择'}}</div>
            <div><i class="el-icon-arrow-right"></i></div>
          </div>
        </div>
        <div class="divider"></div>
        <div class="info-item" @click="showBirthdayDialog = true">
          <div class="info-label">生日</div>
          <div class="info-btn">
            <div>{{info.birthday || '添加'}}</div>
            <div><i class="el-icon-arrow-right"></i></div>
          </div>
        </div>
      </div>

      <!-- Extra Info -->
      <div class="info-box">
        <div class="info-item">
          <div class="info-label">我的积分</div>
          <div class="info-btn">
            <div>{{info.points || 0}}</div>
            <!-- <div><i class="el-icon-arrow-right"></i></div> -->
          </div>
        </div>
        <div class="divider"></div>
        <div class="info-item vip-item">
          <div class="info-label">会员等级</div>
          <div class="info-btn">
            <div><span class="vip-text">{{vipText}}</span></div>
            <!-- <div><i class="el-icon-arrow-right"></i></div> -->
          </div>
        </div>
      </div>
    </div>

    <!-- Hidden File Input -->
    <input type="file" ref="fileInput" accept="image/*" style="display:none" @change="handleFileUpload">

    <!-- Dialogs -->
    <el-dialog title="修改昵称" v-model="showNickNameDialog" width="90%" custom-class="custom-dialog">
      <el-input v-model="temp.nickName" placeholder="请输入昵称" maxlength="20" show-word-limit></el-input>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showNickNameDialog = false">取消</el-button>
          <el-button type="primary" @click="saveNickName">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <el-dialog title="修改个人介绍" v-model="showIntroduceDialog" width="90%" custom-class="custom-dialog">
      <el-input type="textarea" v-model="temp.introduce" placeholder="请输入个人介绍" maxlength="200" show-word-limit :rows="4"></el-input>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showIntroduceDialog = false">取消</el-button>
          <el-button type="primary" @click="saveIntroduce">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <el-dialog title="选择性别" v-model="showGenderDialog" width="90%" custom-class="custom-dialog">
      <div class="gender-options">
        <div class="gender-option" :class="{active: temp.gender === '0'}" @click="temp.gender = '0'">
          <i class="el-icon-male" style="color: #409EFF;"></i>
          <div>男</div>
        </div>
        <div class="gender-option" :class="{active: temp.gender === '1'}" @click="temp.gender = '1'">
          <i class="el-icon-female" style="color: #E91E63;"></i>
          <div>女</div>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showGenderDialog = false">取消</el-button>
          <el-button type="primary" @click="saveGender">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <el-dialog title="修改城市" v-model="showCityDialog" width="90%" custom-class="custom-dialog">
      <el-input v-model="temp.city" placeholder="请输入所在城市"></el-input>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showCityDialog = false">取消</el-button>
          <el-button type="primary" @click="saveCity">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <el-dialog title="修改生日" v-model="showBirthdayDialog" width="90%" custom-class="custom-dialog">
        <div style="text-align: center; margin: 20px 0;">
            <el-date-picker
                v-model="temp.birthday"
                type="date"
                placeholder="选择生日"
                value-format="YYYY-MM-DD"
                style="width: 100%">
            </el-date-picker>
        </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showBirthdayDialog = false">取消</el-button>
          <el-button type="primary" @click="saveBirthday">确定</el-button>
        </span>
      </template>
    </el-dialog>

  </div>
</template>

<script>
import { getCurrentUser, getFullUserInfo, updateUser, updateUserInfo, uploadFile } from '@/api/user';
import { filePrefix } from '@/utils/request';

export default {
  name: 'Edit',
  data() {
    return {
      loading: false,
      user: {},
      info: {},
      
      showNickNameDialog: false,
      showIntroduceDialog: false,
      showGenderDialog: false,
      showCityDialog: false,
      showBirthdayDialog: false,

      temp: {
        nickName: '',
        introduce: '',
        gender: '',
        city: '',
        birthday: ''
      }
    }
  },
  computed: {
    genderText() {
        const map = { '0': '男', '1': '女' };
        return map[this.info.gender] || '选择';
    },
    vipText() {
        if (this.info.vipLevel > 0) return `VIP${this.info.vipLevel}`;
        return '普通用户';
    }
  },
  watch: {
    'user.nickName'(val) { this.temp.nickName = val; },
    'info.introduce'(val) { this.temp.introduce = val; },
    'info.gender'(val) { this.temp.gender = val; },
    'info.city'(val) { this.temp.city = val; },
    'info.birthday'(val) { this.temp.birthday = val; }
  },
  created() {
    this.initData();
  },
  methods: {
    goBack() {
      this.$router.go(-1);
    },
    initData() {
      this.loading = true;
      getCurrentUser().then(res => {
        this.user = res.data || res;
        if(this.user.icon && !this.user.icon.startsWith('http')) {
            this.user.icon = this.$fileURL + this.user.icon;
        }
        
        // Init temps
        this.temp.nickName = this.user.nickName;

        if(this.user.id) {
            getFullUserInfo(this.user.id).then(infoRes => {
                this.info = infoRes.data || infoRes;
                // Init temps from info
                this.temp.introduce = this.info.introduce;
                this.temp.gender = this.info.gender;
                this.temp.city = this.info.city;
                this.temp.birthday = this.info.birthday;
            });
        }
      }).finally(() => this.loading = false);
    },
    triggerUpload() {
        this.$refs.fileInput.click();
    },
    handleFileUpload(e) {
        const file = e.target.files[0];
        if(!file) return;
        if(file.size > 2 * 1024 * 1024) return this.$message.warning("图片大小不能超过2MB");
        
        const formData = new FormData();
        formData.append('file', file);
        
        this.loading = true;
        uploadFile(formData).then(res => {
            const path = res.data || res; // Assuming returns path
            // Usually path needs to be stripped of prefix if backend returns full path, 
            // but looking at logic: avatarUrl = data.split(filePrefix)[1];
            // Let's assume backend returns relative path or full path.
            // If backend returns full path like /minio/bucket/file, and we save that.
            // Let's check info-edit.html logic: avatarUrl = data.split(filePrefix)[1];
            
            // To be safe, let's try to just save what we get, or ask user.
            // But based on common.js, fileURL = minioURL + ":" + minioPort + filePrefix;
            // The DB likely stores /images/xxx.jpg (without filePrefix?)
            // info-edit.html: avatarUrl = data.split(filePrefix)[1];
            
            let savePath = path;
            if (path.includes(filePrefix)) {
                savePath = path.split(filePrefix)[1];
            }

            updateUser({ id: this.user.id, icon: savePath }).then(() => {
                this.$message.success("头像修改成功");
                this.user.icon = this.$fileURL + savePath;
            });
        }).finally(() => this.loading = false);
    },
    saveNickName() {
        if(!this.temp.nickName) return this.$message.warning("昵称不能为空");
        updateUser({ id: this.user.id, nickName: this.temp.nickName }).then(() => {
            this.user.nickName = this.temp.nickName;
            this.showNickNameDialog = false;
            this.$message.success("修改成功");
        });
    },
    saveIntroduce() {
        updateUserInfo({ userId: this.user.id, introduce: this.temp.introduce }).then(() => {
            this.info.introduce = this.temp.introduce;
            this.showIntroduceDialog = false;
            this.$message.success("修改成功");
        });
    },
    saveGender() {
        updateUserInfo({ userId: this.user.id, gender: this.temp.gender }).then(() => {
            this.info.gender = this.temp.gender;
            this.showGenderDialog = false;
            this.$message.success("修改成功");
        });
    },
    saveCity() {
        updateUserInfo({ userId: this.user.id, city: this.temp.city }).then(() => {
            this.info.city = this.temp.city;
            this.showCityDialog = false;
            this.$message.success("修改成功");
        });
    },
    saveBirthday() {
        updateUserInfo({ userId: this.user.id, birthday: this.temp.birthday }).then(() => {
            this.info.birthday = this.temp.birthday;
            this.showBirthdayDialog = false;
            this.$message.success("修改成功");
        });
    }
  }
}
</script>

<style scoped>
.edit-page { min-height: 100vh; background: #f5f5f5; padding-bottom: 20px; }
.header { height: 50px; background: white; display: flex; align-items: center; padding: 0 15px; border-bottom: 1px solid #eee; }
.header-title { flex: 1; text-align: center; font-weight: bold; }
.edit-container { padding: 15px; }

.info-box { background: white; border-radius: 8px; overflow: hidden; margin-bottom: 15px; }
.info-item { display: flex; align-items: center; justify-content: space-between; padding: 15px; cursor: pointer; }
.info-item:active { background: #fafafa; }
.info-label { font-size: 15px; color: #333; }
.info-btn { display: flex; align-items: center; color: #999; font-size: 14px; }
.info-btn img { width: 40px; height: 40px; border-radius: 50%; margin-right: 10px; object-fit: cover; }
.info-btn i { margin-left: 5px; }
.text-truncate { max-width: 150px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.divider { height: 1px; background: #f5f5f5; margin: 0 15px; }
.vip-text { background: linear-gradient(to right, #f6e6b6, #d4af37); -webkit-background-clip: text; color: transparent; font-weight: bold; }

.gender-options { display: flex; justify-content: space-around; padding: 20px 0; }
.gender-option { display: flex; flex-direction: column; align-items: center; padding: 15px 30px; border: 1px solid #eee; border-radius: 8px; cursor: pointer; }
.gender-option.active { border-color: #409EFF; background: #ecf5ff; }
.gender-option i { font-size: 24px; margin-bottom: 5px; }
</style>
