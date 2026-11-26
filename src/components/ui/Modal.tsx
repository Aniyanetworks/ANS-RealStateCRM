/* eslint-disable @typescript-eslint/no-explicit-any */
import { Modal as AntdModal } from "antd";
import { ReactNode } from "react";
import { cn } from "../../utils/cn";
import ButtonLoader from "../loader/buttonLoader";

type TProps = {
  isModalOpen: boolean;
  handleOk: () => void;
  handlePrint?: () => void;
  handleCheckout?: () => void;
  toggleCheckoutState?: () => void;
  handleBack?: () => void;
  handleCancel: () => void;
  title?: string | ReactNode;
  children: ReactNode;
  footerLeftBtn?: ReactNode;
  extraFooterBtn?: ReactNode;
  okBtnText?: string;
  printBtnText?: string | null;
  checkoutBtnText?: string | null;
  backBtnText?: string | null;
  cancelBtnText?: string;
  isLoading?: boolean;
  handleCheckoutState?: boolean;
  showOkButton?: boolean;
  modalClass?: string;
  hideFooter?: boolean;
};

const Modal = ({
  isModalOpen,
  handleOk,
  handlePrint,
  handleCheckout,
  toggleCheckoutState,
  handleBack,
  handleCancel,
  children,
  title,
  footerLeftBtn,
  extraFooterBtn,
  okBtnText = "Submit",
  printBtnText = null,
  checkoutBtnText = null,
  backBtnText = null,
  cancelBtnText = "Cancel",
  isLoading = false,
  handleCheckoutState = true,
  showOkButton = true,
  modalClass,
  hideFooter = false,
}: TProps) => {
  return (
    <AntdModal
      title={title}
      open={isModalOpen}
      onOk={handleOk}
      onCancel={handleCancel}
      className={modalClass}
      footer={
        !hideFooter && (
          <div
            className={cn("flex items-center justify-end", {
              "justify-between": footerLeftBtn,
            })}
          >
            {footerLeftBtn}
            <div className="flex items-center gap-3">
              {extraFooterBtn}
              <button onClick={handleCancel} className="cancel-btn">
                {cancelBtnText}
              </button>
              {printBtnText && (
                <button onClick={handlePrint} className="primary-btn">
                  {printBtnText}
                </button>
              )}
              {handleCheckoutState && checkoutBtnText && (
                <button
                  onClick={handleCheckout && toggleCheckoutState}
                  className="primary-btn"
                >
                  {checkoutBtnText}
                </button>
              )}
              {!handleCheckoutState && backBtnText && (
                <button
                  onClick={handleBack && toggleCheckoutState}
                  className="primary-btn"
                >
                  {backBtnText}
                </button>
              )}
              {showOkButton && (
                <button onClick={handleOk} className="primary-btn">
                  {isLoading ? <ButtonLoader /> : okBtnText}
                </button>
              )}
            </div>
          </div>
        )
      }
    >
      {children}
    </AntdModal>
  );
};

export default Modal;
