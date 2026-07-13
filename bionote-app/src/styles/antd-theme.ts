import type { ThemeConfig } from 'antd';

const antdTheme: ThemeConfig = {
  token: {
    colorPrimary: '#0f6b58',
    colorSuccess: '#1e7e4c',
    colorWarning: '#a16612',
    colorError: '#c0392b',
    colorInfo: '#2a6b96',
    colorTextBase: '#1a2128',
    colorBgBase: '#ffffff',
    colorBorder: '#d5dbe3',
    borderRadius: 6,
    fontFamily: `"Segoe UI", "Microsoft YaHei", "PingFang SC", system-ui, sans-serif`,
    fontSize: 14,
    controlHeight: 36,
    lineHeight: 1.55,
  },
  components: {
    Button: {
      fontWeight: 600,
      borderRadius: 6,
      controlHeight: 36,
      paddingInline: 15,
    },
    Table: {
      headerBg: '#f8f9fb',
      headerColor: '#6b7885',
      borderColor: '#e4e8ee',
      rowHoverBg: 'rgba(15,107,88,0.025)',
      fontSize: 14,
    },
    Card: {
      borderRadius: 8,
    },
    Input: {
      borderRadius: 6,
      controlHeight: 36,
    },
    Select: {
      borderRadius: 6,
      controlHeight: 36,
    },
    Menu: {
      itemBorderRadius: 6,
      itemHeight: 38,
    },
    Layout: {
      bodyBg: '#f2f4f6',
      headerBg: 'rgba(242,244,246,0.92)',
      siderBg: '#143830',
    },
    Tabs: {
      itemColor: '#3e4b56',
    },
  },
};

export default antdTheme;
