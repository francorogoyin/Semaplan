const getConst = {
  // Extension UI state
  openingTimerIsActiveData: "untrap_openingTimerIsActiveData",
  openingTimerValueData: "untrap_openingTimerValueData",
  openingTimerMessageData: "untrap_openingTimerMessageData",

  passwordLockingIsActiveData: "untrap_passwordLockingIsActiveData02092023",
  passwordLockingPasswordData: "untrap_passwordLockingPasswordData02092023",
  passwordLockingPromptData: "untrap_passwordLockingPromptData02092023",
  passwordLockingResetIsActiveData:
    "untrap_passwordLockingResetIsActiveData02092023",
  passwordLockingResetPeriodData:
    "untrap_passwordLockingResetPeriodData02092023",
  passwordLockingResetFinalDateData:
    "untrap_passwordLockingResetFinalDateData02092023",

  // Youtube page state

  filterIsEnabledData: "untrap_filterIsEnabledData",

  filterVideosRulesData: "untrap_videosFilterRulesData3",
  filterChannelsRulesData: "untrap_filterChannelsRulesData3",
  filterCommentsRulesData: "untrap_filterCommentsRulesData3",
  filterPostsRulesData: "untrap_filterPostsRulesData3",

  blocklistContextMenuButtonsData: "untrap_blocklistContextMenuButtonsData",

  youtubeBlockingScheduleIsActiveData:
    "untrap_youtubeBlockingScheduleIsActiveData",
  youtubeBlockingScheduleDaysData: "untrap_youtubeBlockingScheduleDaysData",
  youtubeBlockingScheduleBlockExtensionData:
    "untrap_youtubeBlockingScheduleBlockExtensionData",
  youtubeBlockingScheduleTimeIntervalsData:
    "untrap_youtubeBlockingScheduleTimeIntervalsData",

  youtubeBlockingTemporaryIsActiveData:
    "untrap_youtubeBlockingTemporaryIsActiveData",
  youtubeBlockingTemporaryDurationData:
    "untrap_youtubeBlockingTemporaryDurationData",
  youtubeBlockingTemporaryBlockExtensionData:
    "untrap_youtubeBlockingTemporaryBlockExtensionData",
  youtubeBlockingTemporaryStartDateData:
    "untrap_youtubeBlockingTemporaryStartDateData",
  blockedByUnTrap: "untrap_blocking_by_untrap",

  channelTabsIds: [
    "untrap_channel_hide_channel_menu_button_home",
    "untrap_channel_hide_channel_menu_button_videos",
    "untrap_channel_hide_channel_menu_button_releases",
    "untrap_channel_hide_channel_menu_button_podcasts",
    "untrap_channel_hide_channel_menu_button_shorts",
    "untrap_channel_hide_channel_menu_button_live",
    "untrap_channel_hide_channel_menu_button_playlists",
    "untrap_channel_hide_channel_menu_button_community",
    "untrap_channel_hide_channel_menu_button_channels",
    "untrap_channel_hide_channel_menu_button_store",
  ],

  thumbnailFilterIds: [
    "untrap_video_card_blur_thumbnail",
    "untrap_video_card_grayscale_thumbnail",
    "untrap_video_card_opacity_thumbnail",
  ],

  // Summarize Video State

  isShowSummarizeWindow: "untrap_isShowSummarizeWindow",
  isAddEmojis: "untrap_add_emojis",
  isGenerateAutomatically: "untrap_generate_automatically",
  pickedTab: "untrap_picked_tab",
  pickedBulletPoint: "untrap_picked_bulletPoint",

  keyInsightSectionGrouped: "untrap_grouped",
  expandCollapseAddButton: "untrap_expand_collapse",
  timestampsLinkAdd: "untrap_timestamps_link",

  transcriptTranslateLanguage: "untrap_transcriptTranslateLanguage",

  //Remote options state

  settingsStylesArray: "untrap_settings_styles_array",
  settingsStylesArrayMobile: "untrap_settings_styles_array_mobile",

  //Shared state

  gradientIndex: "untrap_gradient_index",
  gradientCurrentDate: "untrap_gradient_current_date",

  myOtherAppsData: "untrap_myOtherAppsData",

  shortcuts: ["untrap_shortcuts_disable_enable"],

  userUniqueIdentifier: "userUniqueIdentifier",

  //Meta data

  nextDateForUpdate: "untrap_next_date_to_update",

  currentVersionOnSettingsRelease: "untrap_current_version_on_settings_release",

  init: "init",
  updateSchedule: "updateSchedule",

  date: "untrap_extension_init_date",
  time: "untrap_extension_init_time",

  hour: "untrap_schedule_update_hour",
  weekDay: "untrap_schedule_update_week_day",

  //Store entity

  runtimeSnapshot: "untrap_runtime_snapshot",
  remoteOptionsData: "untrap_remote_options_data",
  optionsState: "untrap_options_state",
  sharedState: "untrap_shared_state",
  system: "untrap_system_config",
  meta: "untrap_meta",
  extensionUiState: "untrap_extension_ui_state",
  youtubePageState: "untrap_youtube_page_state",
  summarizeWindowState: "untrap_summarize_window_state",

  //Global

  hideAllShorts: "untrap_global_hide_all_shorts",
  hideAllAds: "untrap_global_hide_all_ads",
  videoQuality: "untrap_global_video_quality",
  showNativePlayer: "untrap_global_show_native_video_player",
  skipVideoAds: "untrap_global_skip_video_ads",
  disableAutoplay: "untrap_global_disable_video_autoplay",
  addSummarizeButtonState: "untrap_global_add_summarize_button",
  // rating: "untrap_rating",
  // isWriteReview: "untrap_is_write_review",
  // visited_days: "untrap_visited_days",

  isTesterRelease: "untrap_global_get_testers_release",
};

const getConstNotSyncing = {
  // Syncing

  isCloudSyncingData: "untrap_isCloudSyncingData",
  lastSyncingDateData: "untrap_cloudLastSyncingDateData",

  // App Language

  extensionLanguage: "untrap_extensionLanguageData",

  // Extension Is Enabled

  extensionIsEnabledData: "untrap_global_enable",

  // Extension block time

  extensionBlockTime: "untrap_extension_blockTime",
  extensionBlockLastedTime: "untrap_extension_block_lasted_time",

  // Extension enable time

  extensionEnableTime: "untrap_extension_enableTime",
  extensionEnableLastedTime: "untrap_extension_enable_lasted_time",

  // PRO Credentials

  pro_usernameData: "untrap_pro_username",
  pro_passwordData: "untrap_pro_password",

  temporary_username: "untrap_temporary_username",
  temporary_password: "untrap_temporary_password",
  temporary_uuid: "untrap_temporary_uuid",

  isShowVerificationScreen: "untrap_is_show_verification_screen",

  emailVerificationType: "untrap_email_verification_type",

  isUserPro: "untrap_is_user_pro",

  isGetUnlimitedProPlanNonAuth: "untrap_is_unlimited_pro_plan_no_auth",

  extensionThemeData: "untra_extension_theme_data",

  notSyncingState: "untrap_not_syncing_state",
};
