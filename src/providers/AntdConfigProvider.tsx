import { ConfigProvider } from "antd";
import { ReactNode } from "react";

const AntdConfigProvider = ({ children }: { children: ReactNode }) => {
  return (
    <ConfigProvider
      theme={{
        token: {
          fontFamily: "'Poppins', sans-serif",
          colorPrimary: "#0f766e",
          colorLink: "#0f766e",
        },
        components: {
          Layout: {
            siderBg: "#0f766e",
          },

          Switch: {},
          Button: {},
          Menu: {
            itemColor: "#fff",
            itemHoverColor: "#fff",
            itemHoverBg: "#115e59",
            itemSelectedColor: "#fff",
            itemSelectedBg: "#14b8a6",
            groupTitleColor: "#fff",
            itemActiveBg: "#0d9488",
          },
          Dropdown: {
            paddingBlock: 3,
          },
          Table: {
            cellPaddingBlock: 3,
            cellPaddingInline: 10,
            cellPaddingBlockSM: 3,
            cellPaddingInlineSM: 10,
          },
        },
      }}
    >
      {children}
    </ConfigProvider>
  );
};

export default AntdConfigProvider;

