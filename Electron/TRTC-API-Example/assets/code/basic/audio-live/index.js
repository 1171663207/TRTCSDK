(() => {
  const { ipcRenderer } = require('electron');
  const TRTCCloud = require('trtc-electron-sdk').default;
  const {
    TRTCAppScene,
    TRTCParams,
    TRTCRoleType,
  } = require('trtc-electron-sdk/liteav/trtc_define');

  // todo: Examples 设置区
  const userId =  '' || window.globalUserId; // 用户名，必填
  const roomId = 0 || window.globalRoomId; // 会议号，数字类型（大于零），必填;
  // SDKAPPID, SECRETKEY 可在 assets/debug/gen-test-user-sig.js 里进行设置
  const info = window.genTestUserSig(userId);
  const sdkAppId =  0 || info.sdkappid; // 应用编号，必填
  const userSig = '' || info.userSig; // 用户签名，必填

  const LOG_PREFIX = 'Audio live';
  const trtc = new TRTCCloud();
  console.log('TRTC version:', trtc.getSDKVersion());

  function validParams(userId, roomId, sdkAppId, userSig) {
    const errors = [];
    if (!userId) {
      errors.push('userId 未设置');
    }
    if (roomId === 0) {
      errors.push('roomId 未设置');
    }
    if (sdkAppId === 0) {
      errors.push('sdkAppId 未设置');
    }
    if (userSig === '') {
      errors.push('userSig 未设置');
    }
    if (errors.length) {
      ipcRenderer.send('notification', LOG_PREFIX, errors.join(','));
      return false;
    }
    return true;
  }
  if (!validParams(userId, roomId, sdkAppId, userSig)) {
    return;
  }

  // 本地用户进入房间事件处理
  function onEnterRoom(elapsed) {
    console.info(`${LOG_PREFIX} onEnterRoom: elapsed: ${elapsed}`);
    if (elapsed < 0) {
      // 小于零表示进房失败
      console.error(`${LOG_PREFIX} enterRoom failed`);
    }
  }

  // 本地用户退出房间事件处理
  function onExitRoom(reason) {
    console.info(`${LOG_PREFIX} onExitRoom: reason: ${reason}`);
  }

  // Error事件处理
  function onError(errCode, errMsg) {
    console.info(`${LOG_PREFIX} onError: errCode: ${errCode}, errMsg: ${errMsg}`);
  }

  const anchorSet = new Set();
  // 远程用户进入房间事件处理
  // 直播场景下，场景不限制观众的数量，如果任何用户进出都抛出回调会引起很大的性能损耗，
  // 所以该场景下只有主播进入房间时才会触发该通知，观众进入房间不会触发该通知。
  function onRemoteUserEnterRoom(userId) {
    console.info(`${LOG_PREFIX} onRemoteUserEnterRoom: userId: ${userId}`);
    // 这里可以收集所有远程人员，放入列表进行管理
    anchorSet.add(userId);
  }

  // 远程用户退出房间事件处理
  // 直播场景下，场景不限制观众的数量，如果任何用户进出都抛出回调会引起很大的性能损耗，
  // 所以该场景下只有主播进入房间时才会触发该通知，观众进入房间不会触发该通知。
  function onRemoteUserLeaveRoom(userId, reason) {
    console.info(`${LOG_PREFIX} onRemoteUserLeaveRoom: userId: ${userId}, ${reason}`);
    anchorSet.delete(userId);
  }

  // 远程用户开启/关闭音频事件处理
  // - 仅针对主播，观众音频不会采集和上传
  function onUserAudioAvailable(userId, available) {
    console.info(`${LOG_PREFIX} onUserAudioAvailable: userId: ${userId}, available: ${available}`);
    if (available) {
      // 远程用户开启音频
      const remoteUserRoleHTML = document.getElementById('remoteUserRole');
      if (anchorSet.has(userId)) {
        // 主播
        remoteUserRoleHTML.innerText = ' - 主播';
      }
    } else {
      // 远程用户关闭音频
      const remoteUserRoleHTML = document.getElementById('remoteUserRole');
      remoteUserRoleHTML && (remoteUserRoleHTML.innerText = '');
    }
  }

  // 开始播放远程用户的首帧音频事件处理（本地声音暂不通知）
  // - 仅针对主播，观众音频不会采集和上传
  function onFirstAudioFrame(userId) {
    console.info(`${LOG_PREFIX} onFirstAudioFrame: userId: ${userId}`);
  }


  // 通话成员语音音量通知事件处理
  // 此处获取音量大小，只用于UI演示，实际业务如果不需要，可忽略此事件
  function onUserVoiceVolume(userVolumes, userVolumesCount, totalVolume) {
    console.info(`${LOG_PREFIX} onUserVoiceVolume: userVolumesCount: ${userVolumesCount} totalVolume: ${totalVolume} userVolumes:`, userVolumes);
    userVolumes.forEach((item) => {
      if (item.userId) {
        // 远程用户
        const remoteAudioIcon = document.getElementById('remoteUserAudioIcon');
        remoteAudioIcon && (remoteAudioIcon.style.opacity = 0.2 + item.volume / 100);
      } else {
        // 本地用户
        const localAudioIcon = document.getElementById('localUserAudioIcon');
        localAudioIcon && (localAudioIcon.style.opacity = 0.2 + item.volume / 100);
      }
    });
  }

  // 订阅事件
  const subscribeEvents = (rtcCloud) => {
    rtcCloud.on('onError', onError);
    rtcCloud.on('onEnterRoom', onEnterRoom);
    rtcCloud.on('onExitRoom', onExitRoom);
    rtcCloud.on('onRemoteUserEnterRoom', onRemoteUserEnterRoom);
    rtcCloud.on('onRemoteUserLeaveRoom', onRemoteUserLeaveRoom);
    rtcCloud.on('onUserAudioAvailable', onUserAudioAvailable);
    rtcCloud.on('onFirstAudioFrame', onFirstAudioFrame);
    rtcCloud.on('onUserVoiceVolume', onUserVoiceVolume);
  };

  // 取消事件订阅
  const unsubscribeEvents = (rtcCloud) => {
    rtcCloud.off('onError', onError);
    rtcCloud.off('onEnterRoom', onEnterRoom);
    rtcCloud.off('onExitRoom', onExitRoom);
    rtcCloud.off('onRemoteUserEnterRoom', onRemoteUserEnterRoom);
    rtcCloud.off('onRemoteUserLeaveRoom', onRemoteUserLeaveRoom);
    rtcCloud.off('onUserAudioAvailable', onUserAudioAvailable);
    rtcCloud.off('onFirstAudioFrame', onFirstAudioFrame);
    rtcCloud.off('onUserVoiceVolume', onUserVoiceVolume);
  };

  // 进入房间
  function enterRoom() {
    // 启动音量大小提示，调用此接口只为获取音量大小，用于UI演示，实际业务如果不需要，可以不调用
    trtc.enableAudioVolumeEvaluation(300);

    // 启动本地音频采集和上行
    trtc.startLocalAudio();

    const trtcParams = new TRTCParams();
    // 试用、体验时，在以下地址根据 SDKAppID 和 userId 生成 userSig
    // https://console.cloud.tencent.com/trtc/usersigtool
    // 注意：正式生产环境中，userSig需要通过后台生成，前端通过HTTP请求获取
    trtcParams.userId =  userId; // 用户名，必填
    trtcParams.sdkAppId = sdkAppId; // 应用编号，必填
    trtcParams.userSig = userSig; // 用户签名，必填
    trtcParams.roomId = roomId; // 会议号，数字类型（大于零），必填

    // 直播场景下角色类型，非必填，默认是主播类型 TRTCRoleAnchor
    // trtcParams.role = TRTCRoleType.TRTCRoleAudience;
    trtcParams.role = parseInt(document.forms.roleSelectForm.roleType.value, 10);

    trtc.enterRoom(trtcParams, TRTCAppScene.TRTCAppSceneAudioCall);

    const localUserRoleHTML = document.getElementById('localUserRole');
    localUserRoleHTML.innerText = ` - ${trtcParams.role === TRTCRoleType.TRTCRoleAudience ? '观众(音频不上传)' : '主播'}`;
  }

  // 退出房间
  function exitRoom() {
    trtc.stopLocalAudio();
    trtc.exitRoom();
  }

  // ====== 注册事件监听，进入房间：start =================================
  subscribeEvents(trtc);
  enterRoom();
  // ====== 注册事件监听，进入房间：end ===================================

  // ====== 停止运行后，退出房间，清理事件订阅：start =======================
  // 这里借助 ipcRenderer 获取停止示例代码运行事件，
  // 实际项目中直接在“停止”按钮的点击事件中处理即可
  ipcRenderer.on('stop-example', (event, arg) => {
    if (arg.type === 'audio-live') {
      exitRoom();
      setTimeout(() => {
        unsubscribeEvents(trtc);
      }, 1000);
    }
  });
  // ====== 停止运行后，退出房间，清理事件订阅：end =========================
})();