<template>
  <div class="edit-page">
    <div class="header">
      <div class="header-back-btn" @click="goBack"><i class="el-icon-arrow-left"></i></div>
      <div class="header-title">资料编辑</div>
    </div>

    <div class="edit-container" v-loading="loading">
      <!-- Basic Info -->
      <div class="info-box">
        <div class="info-item avatar-item" @click="triggerUpload">
          <div class="info-label">头像</div>
          <div class="info-btn">
            <div class="avatar-wrapper">
               <img :src="user.icon || '/imgs/icons/default-icon.png'" class="avatar-large">
               <div class="camera-overlay"><i class="el-icon-camera-solid"></i></div>
            </div>
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
        <div class="info-item" @click="openCitySheet">
          <div class="info-label">城市</div>
          <div class="info-btn">
            <div>{{info.city || '选择'}}</div>
            <div><i class="el-icon-arrow-right"></i></div>
          </div>
        </div>
        <div class="divider"></div>
        <div class="info-item" @click="openBirthdaySheet">
          <div class="info-label">生日</div>
          <div class="info-btn">
            <div>{{info.birthday || '添加'}}</div>
            <div><i class="el-icon-arrow-right"></i></div>
          </div>
        </div>
      </div>

      <!-- Account Status (Card 3) -->
      <div class="info-box">
        <div class="info-item">
          <div class="info-label">我的积分</div>
          <div class="info-btn">
            <div>{{info.points || 0}}</div>
          </div>
        </div>
        <div class="divider"></div>
        <div class="info-item vip-item">
          <div class="info-label">会员等级</div>
          <div class="info-btn">
            <div><span class="vip-text">{{vipText || '普通用户'}}</span></div>
          </div>
        </div>
      </div>
      
      <!-- Sticky Save Button -->
      <div class="save-btn-container">
         <el-button type="primary" class="save-btn" round @click="handleSaveAll">保存</el-button>
      </div>
    </div>

    <!-- Hidden File Input -->
    <input type="file" ref="fileInput" accept="image/*" style="display:none" @change="handleFileUpload">

    <!-- Dialogs -->
    <!-- Dialogs -->
    <!-- Dialogs -->
    <el-dialog title="修改昵称" v-model="showNickNameDialog" width="85%" center custom-class="ios-alert-dialog" :show-close="false">
      <div class="ios-input-container">
          <input 
            v-model="temp.nickName" 
            type="text" 
            class="ios-input" 
            placeholder="请输入昵称" 
            maxlength="20"
          >
          <div class="ios-input-suffix">
              <i class="el-icon-circle-close ios-clear-icon" v-if="temp.nickName" @click="temp.nickName = ''"></i>
              <span class="ios-word-count">{{ (temp.nickName || '').length }} / 20</span>
          </div>
      </div>
      <div class="ios-dialog-footer">
          <div class="ios-btn cancel" @click="showNickNameDialog = false">取消</div>
          <div class="ios-btn confirm" @click="saveNickName">确定</div>
      </div>
    </el-dialog>

    <el-dialog title="修改个人介绍" v-model="showIntroduceDialog" width="85%" center custom-class="ios-alert-dialog" :show-close="false">
       <div class="ios-textarea-container">
          <textarea 
             v-model="temp.introduce" 
             class="ios-textarea" 
             placeholder="请输入个人介绍" 
             maxlength="200"
          ></textarea>
          <div class="ios-word-count-absolute">{{ (temp.introduce || '').length }} / 200</div>
       </div>
       <div class="ios-dialog-footer">
          <div class="ios-btn cancel" @click="showIntroduceDialog = false">取消</div>
          <div class="ios-btn confirm" @click="saveIntroduce">确定</div>
       </div>
    </el-dialog>

    <el-dialog title="选择性别" v-model="showGenderDialog" width="85%" center custom-class="custom-edit-dialog" :show-close="false">
      <div class="dialog-content">
          <div class="gender-options">
            <div class="gender-option" :class="{active: temp.gender === 0}" @click="temp.gender = 0">
              <i class="el-icon-male" style="color: #409EFF;"></i>
              <div>男</div>
            </div>
            <div class="gender-option" :class="{active: temp.gender === 1}" @click="temp.gender = 1">
              <i class="el-icon-female" style="color: #ff88a7;"></i>
              <div>女</div>
            </div>
          </div>
      </div>
      <div class="dialog-footer-custom">
          <div class="dialog-btn cancel" @click="showGenderDialog = false">取消</div>
          <div class="dialog-btn confirm" @click="saveGender">确定</div>
      </div>
    </el-dialog>

    <!-- City Bottom Sheet -->
    <div class="sheet-overlay" v-if="showCitySheet" @click="showCitySheet = false"></div>
    <div class="sheet-content" :class="{ 'slide-up': showCitySheet }">
       <div class="sheet-header">
           <div class="sheet-btn cancel" @click="showCitySheet = false">取消</div>
           <div class="sheet-title">修改城市</div>
           <div class="sheet-btn confirm" @click="confirmCity">确定</div>
       </div>
       <div class="picker-container">
           <div class="picker-highlight"></div>
           
           <!-- Province Column -->
           <div class="picker-col province-col" ref="provinceCol" @scroll="handleCityScroll('province')">
               <div class="placeholder-item"></div>
               <div class="picker-item" 
                    v-for="p in provinces" :key="p" 
                    :class="{ active: cityPickerValue.province === p }"
                    @click="scrollToCityItem('province', p)">
                   {{ p }}
               </div>
               <div class="placeholder-item"></div>
           </div>
           
           <!-- City Column -->
           <div class="picker-col city-col" ref="cityCol" @scroll="handleCityScroll('city')">
               <div class="placeholder-item"></div>
               <div class="picker-item" 
                    v-for="c in currentCities" :key="c" 
                    :class="{ active: cityPickerValue.city === c }"
                    @click="scrollToCityItem('city', c)">
                   {{ c }}
               </div>
               <div class="placeholder-item"></div>
           </div>
       </div>
    </div>

    <!-- Birthday Bottom Sheet -->
    <div class="sheet-overlay" v-if="showBirthdaySheet" @click="showBirthdaySheet = false"></div>
    <div class="sheet-content" :class="{ 'slide-up': showBirthdaySheet }">
       <div class="sheet-header">
           <div class="sheet-btn cancel" @click="showBirthdaySheet = false">取消</div>
           <div class="sheet-title">修改生日</div>
           <div class="sheet-btn confirm" @click="confirmBirthday">确定</div>
       </div>
       <div class="picker-container">
           <div class="picker-highlight"></div>
           
           <!-- Year Column -->
           <div class="picker-col year-col" ref="yearCol" @scroll="handleScroll('year')">
               <div class="placeholder-item"></div>
               <div class="picker-item" 
                    v-for="y in years" :key="y" 
                    :class="{ active: pickerValue.year === y }"
                    @click="scrollToItem('year', y)">
                   {{ y }}年
               </div>
               <div class="placeholder-item"></div>
           </div>
           
           <!-- Month Column -->
           <div class="picker-col month-col" ref="monthCol" @scroll="handleScroll('month')">
               <div class="placeholder-item"></div>
               <div class="picker-item" 
                    v-for="m in 12" :key="m" 
                    :class="{ active: pickerValue.month === m }"
                    @click="scrollToItem('month', m)">
                   {{ m }}月
               </div>
               <div class="placeholder-item"></div>
           </div>
           
           <!-- Day Column -->
           <div class="picker-col day-col" ref="dayCol" @scroll="handleScroll('day')">
               <div class="placeholder-item"></div>
               <div class="picker-item" 
                    v-for="d in days" :key="d" 
                    :class="{ active: pickerValue.day === d }"
                    @click="scrollToItem('day', d)">
                   {{ d }}日
               </div>
               <div class="placeholder-item"></div>
           </div>
       </div>
    </div>

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
      showCitySheet: false,
      showBirthdaySheet: false,
      
      // City Picker Data
      cityData: {
          '北京': ['北京'],
          '上海': ['上海'],
          '广东': ['广州', '深圳', '佛山', '东莞', '珠海', '中山', '惠州', '江门', '肇庆'],
          '浙江': ['杭州', '宁波', '温州', '嘉兴', '绍兴', '金华', '台州'],
          '江苏': ['南京', '苏州', '无锡', '常州', '南通', '扬州', '徐州'],
          '福建': ['福州', '厦门', '泉州', '漳州', '莆田'],
          '四川': ['成都', '绵阳', '德阳', '宜宾', '南充'],
          '重庆': ['重庆'],
          '湖南': ['长沙', '株洲', '湘潭', '衡阳', '岳阳'],
          '湖北': ['武汉', '黄石', '襄阳', '荆州', '宜昌'],
          '山东': ['济南', '青岛', '淄博', '枣庄', '烟台'],
          '其他': ['海外', '其他']
      },
      cityPickerValue: { province: '广东', city: '佛山' },
      
      // Birthday Picker Data
      years: [],
      days: [],
      pickerValue: { year: 2000, month: 1, day: 1 },
      pickerItemHeight: 44, // Match CSS height

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
    provinces() {
        return Object.keys(this.cityData);
    },
    currentCities() {
        return this.cityData[this.cityPickerValue.province] || [];
    },
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
    // Generate years (1900 - Current + 0)
    const currentYear = new Date().getFullYear();
    for(let i = 1900; i <= currentYear; i++) {
        this.years.push(i);
    }
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
    // City Picker Logic
    openCitySheet() {
        this.showCitySheet = true;
        
        let p = '广东';
        let c = '佛山';
        
        // Simple logic to try and parse existing city
        if (this.info.city) {
            for(const prov in this.cityData) {
                if(this.cityData[prov].includes(this.info.city)) {
                    p = prov;
                    c = this.info.city;
                    break;
                }
                if(this.info.city.includes(prov)) {
                   p = prov;
                   const potentialCity = this.info.city.replace(prov, '').trim();
                   if(this.cityData[prov].includes(potentialCity)) {
                       c = potentialCity;
                   } else {
                       c = this.cityData[prov][0];
                   }
                   break;
                }
            }
        }
        
        this.cityPickerValue.province = p;
        this.cityPickerValue.city = c;
        
        this.$nextTick(() => {
            this.scrollToCityItem('province', p, false);
            this.scrollToCityItem('city', c, false);
        });
    },
    handleCityScroll(type) {
       const refMap = { 'province': 'provinceCol', 'city': 'cityCol' };
       const el = this.$refs[refMap[type]];
       if(!el) return;
       
       const scrollTop = el.scrollTop;
       const index = Math.round(scrollTop / this.pickerItemHeight);
       
       if(type === 'province') {
           const val = this.provinces[index];
           if(val && val !== this.cityPickerValue.province) {
               this.cityPickerValue.province = val;
               // Default to first city of new province
               this.cityPickerValue.city = this.cityData[val][0];
               // Reset city scroll logic will be handled by watcher or updated UI, 
               // but manually scrolling top is safer
               this.$nextTick(() => {
                   this.scrollToCityItem('city', this.cityPickerValue.city, false);
               });
           }
       } else if (type === 'city') {
           const val = this.currentCities[index];
           if(val && val !== this.cityPickerValue.city) {
               this.cityPickerValue.city = val;
           }
       }
    },
    scrollToCityItem(type, val, smooth = true) {
        const refMap = { 'province': 'provinceCol', 'city': 'cityCol' };
        const el = this.$refs[refMap[type]];
        if(!el) return;
        
        let index = -1;
        if(type === 'province') index = this.provinces.indexOf(val);
        if(type === 'city') index = this.currentCities.indexOf(val);
        
        if(index > -1) {
            el.scrollTo({
                top: index * this.pickerItemHeight,
                behavior: smooth ? 'smooth' : 'auto'
            });
            if(type === 'province') {
                if(this.cityPickerValue.province !== val) {
                    this.cityPickerValue.province = val;
                    this.cityPickerValue.city = this.cityData[val][0];
                    this.$nextTick(() => {
                         this.scrollToCityItem('city', this.cityPickerValue.city, false);
                    });
                }
            } else {
                this.cityPickerValue.city = val;
            }
        }
    },
    confirmCity() {
        const { city } = this.cityPickerValue;
        updateUserInfo({ userId: this.user.id, city: city }).then(() => {
            this.info.city = city;
            this.showCitySheet = false;
            this.$message.success("修改成功");
        });
    },

    openBirthdaySheet() {
        this.showBirthdaySheet = true;
        
        let date = new Date();
        if(this.info.birthday) {
            date = new Date(this.info.birthday);
        }
        
        this.pickerValue.year = date.getFullYear();
        this.pickerValue.month = date.getMonth() + 1;
        this.pickerValue.day = date.getDate();
        
        this.updateDays();
        
        this.$nextTick(() => {
            this.scrollToItem('year', this.pickerValue.year, false);
            this.scrollToItem('month', this.pickerValue.month, false);
            this.scrollToItem('day', this.pickerValue.day, false);
        });
    },
    updateDays() {
        const { year, month } = this.pickerValue;
        const lastDay = new Date(year, month, 0).getDate();
        this.days = Array.from({length: lastDay}, (_, i) => i + 1);
        
        if(this.pickerValue.day > lastDay) {
            this.pickerValue.day = lastDay;
            // Adjust scroll if needed
            this.scrollToItem('day', lastDay, true);
        }
    },
    // Scroll Handling
    handleScroll(type) {
       // Debouncing could be added here for performance
       // For now simple calculation on scroll end (or approximated)
       const refMap = { 'year': 'yearCol', 'month': 'monthCol', 'day': 'dayCol' };
       const el = this.$refs[refMap[type]];
       if(!el) return;
       
       const scrollTop = el.scrollTop;
       const index = Math.round(scrollTop / this.pickerItemHeight);
       
       let val;
       if(type === 'year') {
           val = this.years[index];
           if(val && val !== this.pickerValue.year) {
               this.pickerValue.year = val;
               this.updateDays();
           }
       } else if (type === 'month') {
           val = index + 1; // 1-12
           if(val >= 1 && val <= 12 && val !== this.pickerValue.month) {
               this.pickerValue.month = val;
               this.updateDays();
           }
       } else if (type === 'day') {
           val = this.days[index];
           if(val && val !== this.pickerValue.day) {
               this.pickerValue.day = val;
           }
       }
    },
    scrollToItem(type, val, smooth = true) {
        const refMap = { 'year': 'yearCol', 'month': 'monthCol', 'day': 'dayCol' };
        const el = this.$refs[refMap[type]];
        if(!el) return;
        
        let index = -1;
        if(type === 'year') index = this.years.indexOf(val);
        if(type === 'month') index = val - 1;
        if(type === 'day') index = this.days.indexOf(val);
        
        if(index > -1) {
            el.scrollTo({
                top: index * this.pickerItemHeight,
                behavior: smooth ? 'smooth' : 'auto'
            });
            // Update value immediately to feel responsive on click
            this.pickerValue[type] = val;
            if(type !== 'day') this.updateDays();
        }
    },
    confirmBirthday() {
        const { year, month, day } = this.pickerValue;
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        
        updateUserInfo({ userId: this.user.id, birthday: dateStr }).then(() => {
            this.info.birthday = dateStr;
            this.showBirthdaySheet = false;
            this.$message.success("修改成功");
        });
    },
    handleSaveAll() {
       // Currently items save immediately, so this button acts as "Done"
       this.$message.success("保存成功");
       setTimeout(() => {
           this.goBack();
       }, 500);
    }
  }
}
</script>

<style scoped>
.edit-page { min-height: 100vh; background: #f5f5f5; padding-bottom: 80px; padding-top: 50px; /* Space for fixed header */ }
.header { 
    height: 50px; 
    background: white; 
    display: flex; 
    align-items: center; 
    padding: 0 15px; 
    position: fixed; /* Fix header */
    top: 0;
    left: 0;
    right: 0;
    z-index: 99;
    /* Handle safe area for notches */
    padding-top: env(safe-area-inset-top); 
    height: calc(50px + env(safe-area-inset-top));
    box-shadow: 0 1px 2px rgba(0,0,0,0.03); 
}
.header-title { flex: 1; text-align: center; font-weight: bold; font-size: 16px; }
.edit-container { padding: 15px; }

.info-box { background: white; border-radius: 12px; overflow: hidden; margin-bottom: 15px; box-shadow: 0 2px 8px rgba(0,0,0,0.02); }
.info-item { display: flex; align-items: center; justify-content: space-between; padding: 18px 15px; cursor: pointer; min-height: 24px; }
.info-item:active { background: #fafafa; }
.info-label { font-size: 15px; font-weight: 600; color: #333; }
.info-btn { display: flex; align-items: center; color: #999; font-size: 14px; font-weight: 400; }
.info-btn i { margin-left: 5px; font-size: 16px; color: #ccc; }
.text-truncate { max-width: 180px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

/* Avatar specific */
.avatar-item { padding: 12px 15px; }
.avatar-wrapper { position: relative; margin-right: 5px; width: 56px; height: 56px; }
.avatar-large { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; border: 1px solid #f0f0f0; }
.camera-overlay { 
  position: absolute; 
  bottom: 0; 
  right: 0; 
  background: rgba(0,0,0,0.6); 
  width: 20px; 
  height: 20px; 
  border-radius: 50%; 
  display: flex; 
  align-items: center; 
  justify-content: center; 
  color: white; 
  font-size: 12px; 
}

.divider { height: 1px; background: #f9f9f9; margin: 0 15px; }
.vip-text { color: #d4af37; font-weight: bold; }

.gender-options { display: flex; justify-content: space-around; padding: 10px 0; }
.gender-option { width: 100px; height: 100px; display: flex; flex-direction: column; align-items: center; justify-content: center; border: 1px solid #eee; border-radius: 12px; cursor: pointer; transition: all 0.2s; }
.gender-option.active { border-color: #ff2442; background: #fff1f3; }
.gender-option i { font-size: 40px; margin-bottom: 10px; }

.save-btn-container {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 15px 30px;
    background: white;
    box-shadow: 0 -2px 10px rgba(0,0,0,0.05);
    z-index: 100;
}
.save-btn { width: 100%; height: 44px; font-size: 16px; font-weight: bold; background: #ff2442; border-color: #ff2442; }

/* Dialog Custom Styles */
:deep(.custom-edit-dialog) {
    border-radius: 16px !important;
    overflow: hidden;
}
:deep(.el-dialog__header) {
    padding: 20px 0 10px !important;
    text-align: center;
    font-weight: bold;
}
:deep(.el-dialog__body) {
    padding: 10px 20px 20px !important;
}
.dialog-content { padding: 10px 0; }
.edit-input, .edit-textarea { width: 100%; }
.edit-date-picker { width: 100% !important; }

.dialog-footer-custom {
    display: flex;
    border-top: 1px solid #eee;
    margin: 0 -20px -20px; /* Negate padding */
}
.dialog-btn {
    flex: 1;
    height: 50px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    cursor: pointer;
}
.dialog-btn.cancel { color: #666; border-right: 1px solid #eee; }
.dialog-btn.confirm { color: #ff2442; font-weight: bold; background: #fafafa; }
.dialog-btn:active { background: #f0f0f0; }

/* iOS Alert Styles */
:deep(.ios-alert-dialog) {
    border-radius: 14px !important;
    background: rgba(255, 255, 255, 0.95) !important;
    backdrop-filter: blur(10px);
    box-shadow: 0 0 20px rgba(0,0,0,0.1);
}
:deep(.ios-alert-dialog .el-dialog__header) {
    padding: 20px 0 10px !important;
}
:deep(.ios-alert-dialog .el-dialog__title) {
    font-weight: 600;
    font-size: 17px;
}
:deep(.ios-alert-dialog .el-dialog__body) {
    padding: 0 24px 24px !important;
}

.ios-input-container {
    background: #f2f2f2;
    border-radius: 6px;
    padding: 8px 12px;
    display: flex;
    align-items: center;
    border: 0.5px solid rgba(0,0,0,0.05);
}
.ios-input {
    border: none;
    background: transparent;
    flex: 1;
    height: 24px;
    font-size: 14px; /* iOS standard input size */
    outline: none;
    color: #000;
    padding: 0;
}
.ios-input-suffix {
    display: flex;
    align-items: center;
    margin-left: 8px;
}
.ios-clear-icon {
    font-size: 14px;
    color: #ccc;
    margin-right: 6px;
    cursor: pointer;
}
.ios-word-count {
    font-size: 12px;
    color: #999;
}

.ios-dialog-footer {
    display: flex;
    border-top: 0.5px solid rgba(0,0,0,0.2); /* Thinner separator */
    margin: 0 -20px -20px !important; /* Override default negative wrap */
    /* Wait, the negative margin depends on el-dialog-body usage. 
       In custom-edit-dialog logic we removed body padding tricks. 
       Let's stick to simple flex.
    */
}
.ios-btn {
    flex: 1;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 17px;
    cursor: pointer;
}
.ios-btn.cancel {
    color: #007aff; /* iOS Blue */
    border-right: 0.5px solid rgba(0,0,0,0.2);
}
.ios-btn.confirm {
    color: #007aff; /* iOS Blue by default, user asked for bold blue or red */
    font-weight: 600;
}
/* User mentioned "standard blue or gray" for cancel, "bold blue" for confirm. */
/* Let's follow the screenshot which had red confirm. 
   But user text said: "Cancel in standard blue/gray, Confirm in bold blue (or keep red)".
   The previous dialog had red. Let's start with standard iOS Blue for consistency to 'system look' unless destructive.
   Nickname change is not destructive. Blue is better.
*/

.ios-textarea-container {
    background: #f5f5f5;
    border-radius: 8px;
    position: relative;
    padding: 0;
    overflow: hidden;
    border: 0.5px solid rgba(0,0,0,0.05);
}
.ios-textarea {
    width: 100%;
    height: 120px;
    min-height: 120px;
    background: transparent;
    border: none;
    padding: 12px 12px 30px 12px; /* Bottom padding for counter */
    font-size: 15px;
    color: #333;
    resize: none;
    outline: none;
    display: block;
    box-sizing: border-box;
    font-family: inherit;
    line-height: 1.5;
}
.ios-word-count-absolute {
    position: absolute;
    bottom: 8px;
    right: 12px;
    font-size: 12px;
    color: #999;
    pointer-events: none;
}

/* Bottom Sheet Picker Styles */
.sheet-overlay {
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0,0,0,0.5);
    z-index: 199;
    animation: fadeIn 0.3s;
}
.sheet-content {
    position: fixed;
    bottom: -100%;
    left: 0; right: 0;
    background: white;
    z-index: 200;
    border-radius: 16px 16px 0 0;
    transition: bottom 0.3s ease-out;
}
.sheet-content.slide-up {
    bottom: 0;
}
.sheet-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 15px 20px;
    border-bottom: 1px solid #eee;
}
.sheet-title { font-size: 16px; font-weight: bold; color: #333; }
.sheet-btn { font-size: 15px; cursor: pointer; padding: 5px; }
.sheet-btn.cancel { color: #999; }
.sheet-btn.confirm { color: #ff6633; font-weight: bold; }

.picker-container {
    position: relative;
    height: 220px; /* 5 x 44px */
    display: flex;
    overflow: hidden;
    background: white;
}
.picker-highlight {
    position: absolute;
    top: 88px; /* 2 items down */
    left: 0; right: 0;
    height: 44px;
    border-top: 1px solid #f0f0f0;
    border-bottom: 1px solid #f0f0f0;
    pointer-events: none;
    z-index: 2;
}
.picker-col {
    flex: 1;
    height: 100%;
    overflow-y: scroll;
    scroll-snap-type: y mandatory;
    padding: 0; /* Handled by placeholders */
    position: relative;
    z-index: 1;
}
/* Hide scrollbar */
.picker-col::-webkit-scrollbar { display: none; }

.placeholder-item { height: 88px; flex-shrink: 0; }
.picker-item {
    height: 44px;
    line-height: 44px;
    text-align: center;
    font-size: 16px;
    color: #999;
    scroll-snap-align: center;
    transition: all 0.2s;
}
.picker-item.active {
    color: #333;
    font-weight: bold;
    font-size: 18px;
}

@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
</style>
