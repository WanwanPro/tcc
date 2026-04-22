/**
 * 定位服务封装模块
 * 支持：wx.getLocation 原生定位 + 腾讯位置服务 SDK（带签名验证）
 */

// 腾讯位置服务 Key
const TENCENT_MAP_KEY = 'ASPBZ-XDJLZ-GNMXU-7OS6Q-47WDK-EXFE6';
// 腾讯位置服务 Secret Key（用于签名）
const TENCENT_SECRET_KEY = 'gdwvfuaP6cxlsqed5ib0wUUrAy9xztoV';

/**
 * 生成腾讯位置服务请求签名
 * 签名算法：MD5(请求路径 + "?" + 按key排序后的参数串 + SK)
 * 文档：https://lbs.qq.com/faq/serverFaq/webserviceKey
 */
function generateSignature(urlPath, params) {
  // 1. 参数按 key 升序排序
  const sortedKeys = Object.keys(params).sort();
  const paramStr = sortedKeys.map(k => `${k}=${params[k]}`).join('&');

  // 2. 拼接签名串：请求路径 + ? + 参数串 + SK
  const signStr = `${urlPath}?${paramStr}${TENCENT_SECRET_KEY}`;

  // 3. MD5 加密
  return md5(signStr);
}

/**
 * 简单的 MD5 实现（微信小程序环境）
 */
function md5(string) {
  const rotateLeft = (lValue, iShiftBits) => (lValue << iShiftBits) | (lValue >>> (32 - iShiftBits));

  const addUnsigned = (lX, lY) => {
    let lX4, lY4, lX8, lY8, lResult;
    lX8 = (lX & 0x80000000);
    lY8 = (lY & 0x80000000);
    lX4 = (lX & 0x40000000);
    lY4 = (lY & 0x40000000);
    lResult = (lX & 0x3FFFFFFF) + (lY & 0x3FFFFFFF);
    if (lX4 & lY4) return (lResult ^ 0x80000000 ^ lX8 ^ lY8);
    if (lX4 | lY4) {
      if (lResult & 0x40000000) return (lResult ^ 0xC0000000 ^ lX8 ^ lY8);
      else return (lResult ^ 0x40000000 ^ lX8 ^ lY8);
    }
    return (lResult ^ lX8 ^ lY8);
  };

  const f = (x, y, z) => (x & y) | ((~x) & z);
  const g = (x, y, z) => (x & z) | (y & (~z));
  const h = (x, y, z) => (x ^ y ^ z);
  const i = (x, y, z) => (y ^ (x | (~z)));

  const ff = (a, b, c, d, x, s, ac) => {
    a = addUnsigned(a, addUnsigned(addUnsigned(f(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  };

  const gg = (a, b, c, d, x, s, ac) => {
    a = addUnsigned(a, addUnsigned(addUnsigned(g(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  };

  const hh = (a, b, c, d, x, s, ac) => {
    a = addUnsigned(a, addUnsigned(addUnsigned(h(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  };

  const ii = (a, b, c, d, x, s, ac) => {
    a = addUnsigned(a, addUnsigned(addUnsigned(i(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  };

  const convertToWordArray = (str) => {
    let lWordCount;
    const lMessageLength = str.length;
    const lNumberOfWordsTemp1 = lMessageLength + 8;
    const lNumberOfWordsTemp2 = (lNumberOfWordsTemp1 - (lNumberOfWordsTemp1 % 64)) / 64;
    const lNumberOfWords = (lNumberOfWordsTemp2 + 1) * 16;
    const lWordArray = new Array(lNumberOfWords - 1);
    let lBytePosition = 0;
    let lByteCount = 0;
    while (lByteCount < lMessageLength) {
      lWordCount = (lByteCount - (lByteCount % 4)) / 4;
      lBytePosition = (lByteCount % 4) * 8;
      lWordArray[lWordCount] = (lWordArray[lWordCount] | (str.charCodeAt(lByteCount) << lBytePosition));
      lByteCount++;
    }
    lWordCount = (lByteCount - (lByteCount % 4)) / 4;
    lBytePosition = (lByteCount % 4) * 8;
    lWordArray[lWordCount] = lWordArray[lWordCount] | (0x80 << lBytePosition);
    lWordArray[lNumberOfWords - 2] = lMessageLength << 3;
    lWordArray[lNumberOfWords - 1] = lMessageLength >>> 29;
    return lWordArray;
  };

  const wordToHex = (lValue) => {
    let wordToHexValue = '', wordToHexValueTemp = '', lByte, lCount;
    for (lCount = 0; lCount <= 3; lCount++) {
      lByte = (lValue >>> (lCount * 8)) & 255;
      wordToHexValueTemp = '0' + lByte.toString(16);
      wordToHexValue = wordToHexValue + wordToHexValueTemp.substr(wordToHexValueTemp.length - 2, 2);
    }
    return wordToHexValue;
  };

  let x = [];
  let k, AA, BB, CC, DD, a, b, c, d;
  const S11 = 7, S12 = 12, S13 = 17, S14 = 22;
  const S21 = 5, S22 = 9, S23 = 14, S24 = 20;
  const S31 = 4, S32 = 11, S33 = 16, S34 = 23;
  const S41 = 6, S42 = 10, S43 = 15, S44 = 21;

  string = unescape(encodeURIComponent(string));
  x = convertToWordArray(string);
  a = 0x67452301; b = 0xEFCDAB89; c = 0x98BADCFE; d = 0x10325476;

  for (k = 0; k < x.length; k += 16) {
    AA = a; BB = b; CC = c; DD = d;
    a = ff(a, b, c, d, x[k + 0], S11, 0xD76AA478);
    d = ff(d, a, b, c, x[k + 1], S12, 0xE8C7B756);
    c = ff(c, d, a, b, x[k + 2], S13, 0x242070DB);
    b = ff(b, c, d, a, x[k + 3], S14, 0xC1BDCEEE);
    a = ff(a, b, c, d, x[k + 4], S11, 0xF57C0FAF);
    d = ff(d, a, b, c, x[k + 5], S12, 0x4787C62A);
    c = ff(c, d, a, b, x[k + 6], S13, 0xA8304613);
    b = ff(b, c, d, a, x[k + 7], S14, 0xFD469501);
    a = ff(a, b, c, d, x[k + 8], S11, 0x698098D8);
    d = ff(d, a, b, c, x[k + 9], S12, 0x8B44F7AF);
    c = ff(c, d, a, b, x[k + 10], S13, 0xFFFF5BB1);
    b = ff(b, c, d, a, x[k + 11], S14, 0x895CD7BE);
    a = ff(a, b, c, d, x[k + 12], S11, 0x6B901122);
    d = ff(d, a, b, c, x[k + 13], S12, 0xFD987193);
    c = ff(c, d, a, b, x[k + 14], S13, 0xA679438E);
    b = ff(b, c, d, a, x[k + 15], S14, 0x49B40821);
    a = gg(a, b, c, d, x[k + 1], S21, 0xF61E2562);
    d = gg(d, a, b, c, x[k + 6], S22, 0xC040B340);
    c = gg(c, d, a, b, x[k + 11], S23, 0x265E5A51);
    b = gg(b, c, d, a, x[k + 0], S24, 0xE9B6C7AA);
    a = gg(a, b, c, d, x[k + 5], S21, 0xD62F105D);
    d = gg(d, a, b, c, x[k + 10], S22, 0x2441453);
    c = gg(c, d, a, b, x[k + 15], S23, 0xD8A1E681);
    b = gg(b, c, d, a, x[k + 4], S24, 0xE7D3FBC8);
    a = gg(a, b, c, d, x[k + 9], S21, 0x21E1CDE6);
    d = gg(d, a, b, c, x[k + 14], S22, 0xC33707D6);
    c = gg(c, d, a, b, x[k + 3], S23, 0xF4D50D87);
    b = gg(b, c, d, a, x[k + 8], S24, 0x455A14ED);
    a = gg(a, b, c, d, x[k + 13], S21, 0xA9E3E905);
    d = gg(d, a, b, c, x[k + 2], S22, 0xFCEFA3F8);
    c = gg(c, d, a, b, x[k + 7], S23, 0x676F02D9);
    b = gg(b, c, d, a, x[k + 12], S24, 0x8D2A4C8A);
    a = hh(a, b, c, d, x[k + 5], S31, 0xFFFA3942);
    d = hh(d, a, b, c, x[k + 8], S32, 0x8771F681);
    c = hh(c, d, a, b, x[k + 11], S33, 0x6D9D6122);
    b = hh(b, c, d, a, x[k + 14], S34, 0xFDE5380C);
    a = hh(a, b, c, d, x[k + 1], S31, 0xA4BEEA44);
    d = hh(d, a, b, c, x[k + 4], S32, 0x4BDECFA9);
    c = hh(c, d, a, b, x[k + 7], S33, 0xF6BB4B60);
    b = hh(b, c, d, a, x[k + 10], S34, 0xBEBFBC70);
    a = hh(a, b, c, d, x[k + 13], S31, 0x289B7EC6);
    d = hh(d, a, b, c, x[k + 0], S32, 0xEAA127FA);
    c = hh(c, d, a, b, x[k + 3], S33, 0xD4EF3085);
    b = hh(b, c, d, a, x[k + 6], S34, 0x4881D05);
    a = hh(a, b, c, d, x[k + 9], S31, 0xD9D4D039);
    d = hh(d, a, b, c, x[k + 12], S32, 0xE6DB99E5);
    c = hh(c, d, a, b, x[k + 15], S33, 0x1FA27CF8);
    b = hh(b, c, d, a, x[k + 2], S34, 0xC4AC5665);
    a = ii(a, b, c, d, x[k + 0], S41, 0xF4292244);
    d = ii(d, a, b, c, x[k + 7], S42, 0x432AFF97);
    c = ii(c, d, a, b, x[k + 14], S43, 0xAB9423A7);
    b = ii(b, c, d, a, x[k + 5], S44, 0xFC93A039);
    a = ii(a, b, c, d, x[k + 12], S41, 0x655B59C3);
    d = ii(d, a, b, c, x[k + 3], S42, 0x8F0CCC92);
    c = ii(c, d, a, b, x[k + 10], S43, 0xFFEFF47D);
    b = ii(b, c, d, a, x[k + 1], S44, 0x85845DD1);
    a = ii(a, b, c, d, x[k + 8], S41, 0x6FA87E4F);
    d = ii(d, a, b, c, x[k + 15], S42, 0xFE2CE6E0);
    c = ii(c, d, a, b, x[k + 6], S43, 0xA3014314);
    b = ii(b, c, d, a, x[k + 13], S44, 0x4E0811A1);
    a = ii(a, b, c, d, x[k + 4], S41, 0xF7537E82);
    d = ii(d, a, b, c, x[k + 11], S42, 0xBD3AF235);
    c = ii(c, d, a, b, x[k + 2], S43, 0x2AD7D2BB);
    b = ii(b, c, d, a, x[k + 9], S44, 0xEB86D391);
    a = addUnsigned(a, AA);
    b = addUnsigned(b, BB);
    c = addUnsigned(c, CC);
    d = addUnsigned(d, DD);
  }

  const tempValue = wordToHex(a) + wordToHex(b) + wordToHex(c) + wordToHex(d);
  return tempValue.toLowerCase();
}

/**
 * 构建带签名的请求参数
 */
function buildSignedParams(urlPath, baseParams) {
  const params = { ...baseParams, key: TENCENT_MAP_KEY };
  const sig = generateSignature(urlPath, params);
  return { ...params, sig };
}

/**
 * 1. 获取原生 GPS 定位 (经纬度)
 */
function getNativeLocation(options = {}) {
  return new Promise((resolve, reject) => {
    const { type = 'gcj02', altitude = false, highAccuracy = true } = options;

    wx.getLocation({
      type,
      altitude,
      isHighAccuracy: highAccuracy,
      highAccuracyExpireTime: 5000,
      success: (res) => {
        resolve({
          latitude: res.latitude,
          longitude: res.longitude,
          speed: res.speed,
          accuracy: res.accuracy,
          altitude: res.altitude,
          verticalAccuracy: res.verticalAccuracy,
          horizontalAccuracy: res.horizontalAccuracy,
          timestamp: res.timestamp
        });
      },
      fail: (err) => {
        console.error('[定位] 获取位置失败:', err);
        reject(new Error(err.errMsg || '获取位置失败'));
      }
    });
  });
}

/**
 * 2. 使用腾讯位置服务 SDK 获取详细位置信息
 *    包含：地址、POI、行政区划等
 */
function getTencentLocation(options = {}) {
  return new Promise((resolve, reject) => {
    const { type = 'gcj02', highAccuracy = true } = options;

    // 先获取原生坐标
    getNativeLocation({ type, highAccuracy })
      .then((location) => {
        // 调用腾讯位置服务逆地址解析
        return reverseGeocode(location.latitude, location.longitude)
          .then((addressInfo) => {
            resolve({
              ...location,
              ...addressInfo
            });
          })
          .catch(() => {
            // 逆地址解析失败，仍返回基础坐标
            resolve({
              ...location,
              address: '',
              formattedAddress: '',
              poi: null,
              adInfo: null
            });
          });
      })
      .catch(reject);
  });
}

/**
 * 3. 腾讯位置服务 - 逆地址解析 (坐标转地址)
 *    API: https://lbs.qq.com/service/webService/webServiceGuide/webServiceGcoder
 */
function reverseGeocode(latitude, longitude) {
  return new Promise((resolve, reject) => {
    const urlPath = '/ws/geocoder/v1/';
    const params = buildSignedParams(urlPath, {
      location: `${latitude},${longitude}`,
      get_poi: 1,
      poi_options: 'policy=2;radius=500'
    });
    wx.request({
      url: 'https://apis.map.qq.com' + urlPath,
      method: 'GET',
      data: params,
      success: (res) => {
        if (res.data && res.data.status === 0) {
          const result = res.data.result;
          resolve({
            address: result.address,
            formattedAddress: result.formatted_addresses?.recommend || result.address,
            adInfo: {
              nation: result.address_component?.nation,
              province: result.address_component?.province,
              city: result.address_component?.city,
              district: result.address_component?.district,
              street: result.address_component?.street,
              streetNumber: result.address_component?.street_number
            },
            poi: result.pois?.map(p => ({
              id: p.id,
              title: p.title,
              address: p.address,
              category: p.category,
              distance: p._distance,
              location: p.location
            })) || []
          });
        } else {
          reject(new Error(res.data?.message || '逆地址解析失败'));
        }
      },
      fail: (err) => {
        reject(new Error(err.errMsg || '网络请求失败'));
      }
    });
  });
}

/**
 * 4. 腾讯位置服务 - 地址解析 (地址转坐标)
 *    API: https://lbs.qq.com/service/webService/webServiceGuide/webServiceGeocoder
 */
function geocodeAddress(address) {
  return new Promise((resolve, reject) => {
    const urlPath = '/ws/geocoder/v1/';
    const params = buildSignedParams(urlPath, { address: address });
    wx.request({
      url: 'https://apis.map.qq.com' + urlPath,
      method: 'GET',
      data: params,
      success: (res) => {
        if (res.data && res.data.status === 0) {
          const loc = res.data.result.location;
          resolve({
            latitude: loc.lat,
            longitude: loc.lng,
            title: res.data.result.title,
            address: res.data.result.address
          });
        } else {
          reject(new Error(res.data?.message || '地址解析失败'));
        }
      },
      fail: (err) => {
        reject(new Error(err.errMsg || '网络请求失败'));
      }
    });
  });
}

/**
 * 5. 腾讯位置服务 - 计算两点距离
 *    API: https://lbs.qq.com/service/webService/webServiceGuide/webServiceDistance
 */
function calculateDistance(from, to) {
  return new Promise((resolve, reject) => {
    const fromStr = `${from.latitude},${from.longitude}`;
    const toStr = Array.isArray(to)
      ? to.map(t => `${t.latitude},${t.longitude}`).join(';')
      : `${to.latitude},${to.longitude}`;

    const urlPath = '/ws/distance/v1/matrix';
    const params = buildSignedParams(urlPath, {
      mode: 'walking',
      from: fromStr,
      to: toStr
    });

    wx.request({
      url: 'https://apis.map.qq.com' + urlPath,
      method: 'GET',
      data: params,
      success: (res) => {
        if (res.data && res.data.status === 0) {
          const results = res.data.result?.rows?.[0]?.elements || [];
          if (Array.isArray(to)) {
            resolve(results.map((r, i) => ({
              index: i,
              distance: r.distance,
              duration: r.duration,
              distanceText: formatDistance(r.distance),
              durationText: formatDuration(r.duration)
            })));
          } else {
            const r = results[0];
            resolve({
              distance: r.distance,
              duration: r.duration,
              distanceText: formatDistance(r.distance),
              durationText: formatDuration(r.duration)
            });
          }
        } else {
          reject(new Error(res.data?.message || '距离计算失败'));
        }
      },
      fail: (err) => {
        reject(new Error(err.errMsg || '网络请求失败'));
      }
    });
  });
}

/**
 * 6. 腾讯位置服务 - 周边搜索 (查找附近停车场)
 *    API: https://lbs.qq.com/service/webService/webServiceGuide/webServiceSearch
 */
function searchNearby(options = {}) {
  return new Promise((resolve, reject) => {
    const {
      latitude,
      longitude,
      keyword = '停车场',
      radius = 5000,
      pageSize = 20,
      pageIndex = 1
    } = options;

    const urlPath = '/ws/place/v1/search';
    const params = buildSignedParams(urlPath, {
      keyword: keyword,
      boundary: `nearby(${latitude},${longitude},${radius},1)`,
      page_size: pageSize,
      page_index: pageIndex
    });

    wx.request({
      url: 'https://apis.map.qq.com' + urlPath,
      method: 'GET',
      data: params,
      success: (res) => {
        if (res.data && res.data.status === 0) {
          const results = (res.data.data || []).map(item => ({
            id: item.id,
            title: item.title,
            address: item.address,
            tel: item.tel,
            category: item.category,
            location: item.location,
            distance: item._distance,
            distanceText: formatDistance(item._distance)
          }));
          resolve({
            list: results,
            total: res.data.count || 0
          });
        } else {
          reject(new Error(res.data?.message || '搜索失败'));
        }
      },
      fail: (err) => {
        reject(new Error(err.errMsg || '网络请求失败'));
      }
    });
  });
}

/**
 * 7. 检查定位权限状态
 */
function checkLocationAuth() {
  return new Promise((resolve) => {
    wx.getSetting({
      success: (res) => {
        const authSetting = res.authSetting;
        if (authSetting['scope.userLocation'] === true) {
          resolve({ authorized: true, status: 'authorized' });
        } else if (authSetting['scope.userLocation'] === false) {
          resolve({ authorized: false, status: 'denied' });
        } else {
          resolve({ authorized: false, status: 'notDetermined' });
        }
      },
      fail: () => {
        resolve({ authorized: false, status: 'unknown' });
      }
    });
  });
}

/**
 * 8. 引导用户开启定位权限
 */
function requestLocationAuth() {
  return new Promise((resolve, reject) => {
    wx.authorize({
      scope: 'scope.userLocation',
      success: () => {
        resolve({ authorized: true });
      },
      fail: (err) => {
        // 用户拒绝，引导去设置页
        wx.showModal({
          title: '需要定位权限',
          content: '请在设置中开启定位权限，以便查找附近停车场',
          confirmText: '去设置',
          success: (modalRes) => {
            if (modalRes.confirm) {
              wx.openSetting({
                success: (settingRes) => {
                  const authorized = !!settingRes.authSetting['scope.userLocation'];
                  resolve({ authorized });
                }
              });
            } else {
              reject(new Error('用户拒绝授权定位'));
            }
          }
        });
      }
    });
  });
}

// ============ 工具函数 ============

function formatDistance(meters) {
  if (!meters && meters !== 0) return '未知';
  if (meters < 1000) {
    return `${meters}米`;
  }
  return `${(meters / 1000).toFixed(1)}公里`;
}

function formatDuration(seconds) {
  if (!seconds && seconds !== 0) return '未知';
  if (seconds < 60) {
    return `${seconds}秒`;
  }
  if (seconds < 3600) {
    return `${Math.ceil(seconds / 60)}分钟`;
  }
  const hours = Math.floor(seconds / 3600);
  const mins = Math.ceil((seconds % 3600) / 60);
  return `${hours}小时${mins > 0 ? mins + '分钟' : ''}`;
}

// ============ 导出 ============

module.exports = {
  // 基础定位
  getNativeLocation,
  getTencentLocation,

  // 地址解析
  reverseGeocode,
  geocodeAddress,

  // 距离计算
  calculateDistance,

  // 周边搜索
  searchNearby,

  // 权限管理
  checkLocationAuth,
  requestLocationAuth,

  // 工具函数
  formatDistance,
  formatDuration
};
