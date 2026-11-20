import { Language } from './types';

export interface Translations {
  brand: string;
  navQueue: string;
  navUpload: string;
  navSchedule: string;
  navHistory: string;
  connectYouTube: string;
  uploadNextNow: string;
  disconnect: string;
  workspaceTitle: string;
  workspaceSubtitle: string;
  languageLabel: string;
  channelConnected: string;
  channelDisconnected: string;
  channelConnectHint: string;
  missingOAuthWarning: string;
  storageModeBlob: string;
  storageModeLocal: string;
  kpiPending: string;
  kpiUploaded: string;
  kpiNextRun: string;
  kpiDailyTime: string;
  uploadSectionTitle: string;
  uploadSectionDesc: string;
  dropzoneTitle: string;
  dropzoneHint: string;
  browseFiles: string;
  stagedFilesCount: string;
  videoTitleLabel: string;
  videoTitlePlaceholder: string;
  videoDescLabel: string;
  videoDescPlaceholder: string;
  videoTagsLabel: string;
  videoTagsPlaceholder: string;
  privacyLabel: string;
  privacyPublic: string;
  privacyUnlisted: string;
  privacyPrivate: string;
  uploadAllBtn: string;
  uploadingProgress: string;
  clearStaged: string;
  removeStaged: string;
  queueSectionTitle: string;
  queueSectionDesc: string;
  dragHint: string;
  emptyQueueTitle: string;
  emptyQueueDesc: string;
  emptyQueueAction: string;
  moveUp: string;
  moveDown: string;
  editMetadata: string;
  saveChanges: string;
  cancel: string;
  previewVideo: string;
  deleteVideo: string;
  scheduledFor: string;
  scheduleSectionTitle: string;
  scheduleSectionDesc: string;
  enableAutoUpload: string;
  dailyTimeLabel: string;
  timezoneLabel: string;
  defaultPrivacyLabel: string;
  deleteBlobLabel: string;
  saveScheduleBtn: string;
  savingSchedule: string;
  cronExpressionLabel: string;
  cronHelperText: string;
  runCronNowBtn: string;
  runningCronNow: string;
  lastRunLabel: string;
  neverRun: string;
  historySectionTitle: string;
  historySectionDesc: string;
  filterAll: string;
  filterUploaded: string;
  filterFailed: string;
  colVideo: string;
  colStatus: string;
  colUploadedAt: string;
  colYouTubeLink: string;
  colActions: string;
  statusPending: string;
  statusUploading: string;
  statusUploaded: string;
  statusFailed: string;
  openShort: string;
  retryUpload: string;
  emptyHistoryTitle: string;
  emptyHistoryDesc: string;
  closeModal: string;
  shortsTip: string;
  callbackUrlLabel: string;
  copyUrl: string;
  copied: string;
  oauthPopupBlocked: string;
  aspectRatioWarning: string;
  durationWarning: string;
}

export const translations: Record<Language, Translations> = {
  en: {
    brand: 'ShortsFlow',
    navQueue: 'Queue',
    navUpload: 'Upload',
    navSchedule: 'Schedule',
    navHistory: 'History',
    connectYouTube: 'Connect YouTube',
    uploadNextNow: 'Upload Next Short',
    disconnect: 'Disconnect',
    workspaceTitle: 'YouTube Shorts Auto-Scheduler',
    workspaceSubtitle: 'Batch upload vertical videos, drag to set publishing order, and automate daily Shorts drops.',
    languageLabel: 'Language',
    channelConnected: 'Connected Channel',
    channelDisconnected: 'YouTube Not Connected',
    channelConnectHint: 'Connect your Google / YouTube account via OAuth2 to enable automated daily Shorts publishing.',
    missingOAuthWarning: 'Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in environment variables to authorize YouTube.',
    storageModeBlob: 'Vercel Blob Storage active',
    storageModeLocal: 'Local disk preview storage (set BLOB_READ_WRITE_TOKEN for Vercel Blob)',
    kpiPending: 'Pending in Queue',
    kpiUploaded: 'Published Shorts',
    kpiNextRun: 'Next Scheduled Drop',
    kpiDailyTime: 'Daily Upload Time',
    uploadSectionTitle: 'Add Shorts to Queue',
    uploadSectionDesc: 'Select multiple vertical video files (.mp4, .mov, .webm), customize titles & tags, then queue them.',
    dropzoneTitle: 'Drop multiple Short videos here',
    dropzoneHint: 'Supports MP4, MOV, WebM up to 100 MB per clip · #Shorts added automatically if omitted',
    browseFiles: 'Select Video Files',
    stagedFilesCount: 'ready to upload',
    videoTitleLabel: 'Short Title',
    videoTitlePlaceholder: 'Catchy YouTube Short title...',
    videoDescLabel: 'Description',
    videoDescPlaceholder: 'Optional description (#Shorts is appended automatically)',
    videoTagsLabel: 'Tags (comma separated)',
    videoTagsPlaceholder: 'shorts, viral, tutorial, bangla',
    privacyLabel: 'Visibility',
    privacyPublic: 'Public',
    privacyUnlisted: 'Unlisted',
    privacyPrivate: 'Private',
    uploadAllBtn: 'Upload & Add to Queue',
    uploadingProgress: 'Uploading to storage...',
    clearStaged: 'Clear List',
    removeStaged: 'Remove',
    queueSectionTitle: 'Pending Upload Queue',
    queueSectionDesc: 'Drag and drop rows to change the publishing sequence. Position 01 publishes on the next daily run.',
    dragHint: 'Drag handle or use arrows to reorder',
    emptyQueueTitle: 'Your Shorts queue is empty',
    emptyQueueDesc: 'Upload one or more vertical videos above to build your automated daily publishing pipeline.',
    emptyQueueAction: 'Select Videos to Queue',
    moveUp: 'Move up',
    moveDown: 'Move down',
    editMetadata: 'Edit details',
    saveChanges: 'Save',
    cancel: 'Cancel',
    previewVideo: 'Preview video',
    deleteVideo: 'Delete from queue',
    scheduledFor: 'Scheduled',
    scheduleSectionTitle: 'Daily Schedule & Cron',
    scheduleSectionDesc: 'Configure when the Vercel Cron Job publishes the top video from your queue.',
    enableAutoUpload: 'Enable daily auto-upload',
    dailyTimeLabel: 'Daily Upload Time',
    timezoneLabel: 'Timezone',
    defaultPrivacyLabel: 'Default Visibility',
    deleteBlobLabel: 'Remove temporary Blob file after YouTube upload',
    saveScheduleBtn: 'Save Schedule',
    savingSchedule: 'Saving...',
    cronExpressionLabel: 'vercel.json UTC Cron',
    cronHelperText: 'Update vercel.json with this UTC cron string if deploying on Vercel.',
    runCronNowBtn: 'Upload Next Short Now',
    runningCronNow: 'Uploading to YouTube...',
    lastRunLabel: 'Last Automation Run',
    neverRun: 'Not triggered yet',
    historySectionTitle: 'Upload History',
    historySectionDesc: 'Completed and failed YouTube Shorts uploads.',
    filterAll: 'All',
    filterUploaded: 'Uploaded',
    filterFailed: 'Failed',
    colVideo: 'Video Title',
    colStatus: 'Status',
    colUploadedAt: 'Timestamp',
    colYouTubeLink: 'YouTube Short',
    colActions: 'Action',
    statusPending: 'Pending',
    statusUploading: 'Uploading',
    statusUploaded: 'Uploaded',
    statusFailed: 'Failed',
    openShort: 'Watch Short',
    retryUpload: 'Re-queue',
    emptyHistoryTitle: 'No upload history yet',
    emptyHistoryDesc: 'Once your scheduled cron job or manual trigger uploads a Short, the link and timestamp appear here.',
    closeModal: 'Close preview',
    shortsTip: 'Shorts Tip: 9:16 vertical videos under 60s perform best.',
    callbackUrlLabel: 'OAuth2 Redirect URI',
    copyUrl: 'Copy',
    copied: 'Copied',
    oauthPopupBlocked: 'Popup blocked. Please allow popups for this site and try again.',
    aspectRatioWarning: 'Horizontal video detected (YouTube Shorts should be vertical 9:16 or square 1:1)',
    durationWarning: 'Video exceeds 60 seconds (recommended max for classic Shorts)',
  },
  bn: {
    brand: 'শর্টসফ্লো',
    navQueue: 'কিউ তালিকা',
    navUpload: 'আপলোড',
    navSchedule: 'সময়সূচি',
    navHistory: 'ইতিহাস',
    connectYouTube: 'ইউটিউব সংযুক্ত করুন',
    uploadNextNow: 'পরবর্তী শর্ট আপলোড করুন',
    disconnect: 'বিচ্ছিন্ন করুন',
    workspaceTitle: 'ইউটিউব শর্টস অটো-শিডিউলার',
    workspaceSubtitle: 'একসাথে একাধিক ভিডিও আপলোড করুন, ড্র্যাগ করে ক্রম সাজান এবং প্রতিদিন নির্দিষ্ট সময়ে অটো-পাবলিশ করুন।',
    languageLabel: 'ভাষা',
    channelConnected: 'সংযুক্ত চ্যানেল',
    channelDisconnected: 'ইউটিউব সংযুক্ত নয়',
    channelConnectHint: 'স্বয়ংক্রিয়ভাবে প্রতিদিন শর্টস আপলোড করতে আপনার Google / YouTube অ্যাকাউন্ট লগইন করুন।',
    missingOAuthWarning: 'ইউটিউব সংযোগের জন্য এনভায়রনমেন্ট ভ্যারিয়েবলে GOOGLE_CLIENT_ID এবং GOOGLE_CLIENT_SECRET সেট করুন।',
    storageModeBlob: 'Vercel Blob স্টোরেজ সক্রিয়',
    storageModeLocal: 'লোকাল প্রিভিউ স্টোরেজ (Vercel Blob এর জন্য BLOB_READ_WRITE_TOKEN সেট করুন)',
    kpiPending: 'অপেক্ষমাণ ভিডিও',
    kpiUploaded: 'আপলোড সম্পন্ন',
    kpiNextRun: 'পরবর্তী আপলোড সময়',
    kpiDailyTime: 'দৈনিক সময়সূচি',
    uploadSectionTitle: 'কিউতে নতুন শর্টস যোগ করুন',
    uploadSectionDesc: 'একসাথে একাধিক ভিডিও (.mp4, .mov, .webm) নির্বাচন করে শিরোনাম ও ট্যাগ দিন।',
    dropzoneTitle: 'একাধিক শর্টস ভিডিও এখানে ড্রপ করুন',
    dropzoneHint: 'MP4, MOV, WebM (প্রতি ক্লিপ সর্বোচ্চ ১০০ এমবি) · #Shorts স্বয়ংক্রিয়ভাবে যুক্ত হবে',
    browseFiles: 'ভিডিও ফাইল বাছাই করুন',
    stagedFilesCount: 'টি ফাইল আপলোডের জন্য প্রস্তুত',
    videoTitleLabel: 'ভিডিও শিরোনাম',
    videoTitlePlaceholder: 'আকর্ষণীয় ইউটিউব শর্টস শিরোনাম লিখুন...',
    videoDescLabel: 'বিবরণ',
    videoDescPlaceholder: 'ঐচ্ছিক বিবরণ (#Shorts স্বয়ংক্রিয়ভাবে যোগ হবে)',
    videoTagsLabel: 'ট্যাগ (কমা দিয়ে আলাদা করুন)',
    videoTagsPlaceholder: 'shorts, bangla, tutorial, viral',
    privacyLabel: 'প্রাইভেসি',
    privacyPublic: 'পাবলিক',
    privacyUnlisted: 'আনলিস্টেড',
    privacyPrivate: 'প্রাইভেট',
    uploadAllBtn: 'আপলোড করে কিউতে যোগ করুন',
    uploadingProgress: 'স্টোরেজে আপলোড হচ্ছে...',
    clearStaged: 'তালিকা মুছুন',
    removeStaged: 'বাদ দিন',
    queueSectionTitle: 'অপেক্ষমাণ আপলোড কিউ',
    queueSectionDesc: 'ড্র্যাগ অ্যান্ড ড্রপ করে আপলোডের ক্রম পরিবর্তন করুন। ১ নম্বর ভিডিও পরবর্তী শিডিউলে পাবলিশ হবে।',
    dragHint: 'ড্র্যাগ করে অথবা তীর চিহ্ন দিয়ে ক্রম বদলান',
    emptyQueueTitle: 'আপলোড কিউ এখন খালি',
    emptyQueueDesc: 'উপরের বক্স থেকে এক বা একাধিক ভার্টিক্যাল ভিডিও আপলোড করে দৈনিক অটো-শিডিউল শুরু করুন।',
    emptyQueueAction: 'ভিডিও নির্বাচন করুন',
    moveUp: 'উপরে নিন',
    moveDown: 'নিচে নিন',
    editMetadata: 'তথ্য সম্পাদনা',
    saveChanges: 'সংরক্ষণ',
    cancel: 'বাতিল',
    previewVideo: 'ভিডিও দেখুন',
    deleteVideo: 'কিউ থেকে মুছুন',
    scheduledFor: 'নির্ধারিত সময়',
    scheduleSectionTitle: 'দৈনিক সময়সূচি ও ক্রন সেটিংস',
    scheduleSectionDesc: 'Vercel Cron Job প্রতিদিন কখন আপনার কিউয়ের প্রথম ভিডিওটি পাবলিশ করবে তা ঠিক করুন।',
    enableAutoUpload: 'দৈনিক অটো-আপলোড চালু রাখুন',
    dailyTimeLabel: 'দৈনিক আপলোডের সময়',
    timezoneLabel: 'টাইমজোন',
    defaultPrivacyLabel: 'ডিফল্ট প্রাইভেসি',
    deleteBlobLabel: 'ইউটিউবে আপলোডের পর অস্থায়ী Blob ফাইল মুছে ফেলুন',
    saveScheduleBtn: 'সময়সূচি সংরক্ষণ করুন',
    savingSchedule: 'সংরক্ষণ হচ্ছে...',
    cronExpressionLabel: 'vercel.json UTC ক্রন',
    cronHelperText: 'Vercel-এ ডিপ্লয় করার সময় vercel.json ফাইলে এই UTC ক্রন কোড ব্যবহার করতে পারেন।',
    runCronNowBtn: 'এখনই পরবর্তী শর্ট আপলোড করুন',
    runningCronNow: 'ইউটিউবে আপলোড হচ্ছে...',
    lastRunLabel: 'সর্বশেষ অটো-রান',
    neverRun: 'এখনো চালানো হয়নি',
    historySectionTitle: 'আপলোড ইতিহাস',
    historySectionDesc: 'সম্পন্ন হওয়া এবং ব্যর্থ ইউটিউব শর্টস আপলোডের তালিকা।',
    filterAll: 'সবগুলো',
    filterUploaded: 'আপলোড সফল',
    filterFailed: 'ব্যর্থ',
    colVideo: 'ভিডিও শিরোনাম',
    colStatus: 'অবস্থা',
    colUploadedAt: 'সময়',
    colYouTubeLink: 'ইউটিউব শর্ট লিংক',
    colActions: 'পদক্ষেপ',
    statusPending: 'অপেক্ষমাণ',
    statusUploading: 'আপলোড হচ্ছে',
    statusUploaded: 'আপলোড সম্পন্ন',
    statusFailed: 'ব্যর্থ হয়েছে',
    openShort: 'শর্টস দেখুন',
    retryUpload: 'পুনরায় কিউতে দিন',
    emptyHistoryTitle: 'এখনো কোনো আপলোড ইতিহাস নেই',
    emptyHistoryDesc: 'নির্ধারিত ক্রন জব বা ম্যানুয়াল বাটন দিয়ে শর্টস আপলোড করলে তার লিংক এখানে দেখা যাবে।',
    closeModal: 'প্রিভিউ বন্ধ করুন',
    shortsTip: 'টিপস: ৬০ সেকেন্ডের কম দৈর্ঘ্যের ৯:১৬ ভার্টিক্যাল ভিডিও শর্টসের জন্য সেরা।',
    callbackUrlLabel: 'OAuth2 রিডাইরেক্ট URI',
    copyUrl: 'কপি করুন',
    copied: 'কপি হয়েছে',
    oauthPopupBlocked: 'পপআপ ব্লক হয়েছে। অনুগ্রহ করে ব্রাউজারে পপআপ অনুমতি দিয়ে আবার চেষ্টা করুন।',
    aspectRatioWarning: 'আনুভূমিক ভিডিও শনাক্ত হয়েছে (ইউটিউব শর্টসের জন্য ৯:১৬ ভার্টিক্যাল বা ১:১ বর্গাকার ভিডিও প্রয়োজন)',
    durationWarning: 'ভিডিওটি ৬০ সেকেন্ডের বেশি (ক্লাসিক শর্টসের জন্য ৬০ সেকেন্ডের মধ্যে রাখা ভালো)',
  },
};
