import { ConfigProvider } from "antd";
import { ReactNode } from "react";

const AntdConfigProvider = ({ children }: { children: ReactNode }) => {
  return (
    <ConfigProvider
      theme={{
        token: {
          fontFamily: "'Poppins', sans-serif",
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
            itemHoverBg: "#f59e0b",
            itemSelectedColor: "#fff",
            itemSelectedBg: "#f59e0b",
            groupTitleColor: "#fff",
            itemActiveBg: "#99f6e4",
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

// this component is used on top level of the app  for globally apply styles on antd components
// this is not compulsory, we can remove this if needed
