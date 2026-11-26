/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";

import { Button, Card, Col, Form, Input, Row, Spin } from "antd";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";

import {
  useCreateUpdateBranchMutation,
  useGetSpecificBranchDataQuery,
} from "../../../../../redux/api/superadmin/branch/Branchmanagementslice";

const { TextArea } = Input;

const CreateAndUpdateBranch = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { uuid } = useParams();
  const isEditMode = !!uuid;

  const [createUpdateBranch, { isLoading: isSaving }] =
    useCreateUpdateBranchMutation();
  const { data: branchData, isLoading: isFetching } =
    useGetSpecificBranchDataQuery(uuid, {
      skip: !isEditMode,
    });

  const [isViewMode, setIsViewMode] = useState(false);

  useEffect(() => {
    if (isEditMode && branchData?.data?.branchData) {
      const branch = branchData.data.branchData;
      form.setFieldsValue({
        name: branch.name,
        slug: branch.slug,
        email: branch.email,
        phone: branch.phone,
        address: branch.address,
      });
    }
  }, [branchData, form, isEditMode]);

  // Generate slug from name
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    if (!isEditMode) {
      form.setFieldsValue({ slug });
    }
  };

  const onFinish = async (values: any) => {
    try {
      const response = await createUpdateBranch({
        data: values,
        uuid: isEditMode ? uuid : undefined,
      }).unwrap();

      if (response.status) {
        toast.success(
          response.message ||
            `Branch ${isEditMode ? "updated" : "created"} successfully`
        );
        navigate("/dashboard/super-admin/branch-management/branches");
      } else {
        toast.error(response.message || "Something went wrong");
      }
    } catch (error: any) {
      console.error("Error:", error);
      toast.error(error?.data?.message || "Failed to save branch");
    }
  };

  const handleCancel = () => {
    navigate("/dashboard/super-admin/branch-management/branches");
  };

  if (isFetching) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="pb-32">
      <div className="flex items-center justify-between mb-5">
        <h1>{isEditMode ? "Edit Branch" : "Create New Branch"}</h1>
        <div className="flex gap-3">
          {isEditMode && (
            <Button
              onClick={() => setIsViewMode(!isViewMode)}
              className="primary-btn"
            >
              {isViewMode ? "Edit Mode" : "View Mode"}
            </Button>
          )}
        </div>
      </div>

      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          disabled={isViewMode}
          size="large"
        >
          <Row gutter={[16, 0]}>
            <Col xs={24} md={12}>
              <Form.Item
                label="Branch Name"
                name="name"
                rules={[
                  { required: true, message: "Please enter branch name" },
                  { min: 2, message: "Name must be at least 2 characters" },
                  { max: 100, message: "Name must not exceed 100 characters" },
                ]}
                style={{ marginBottom: 16 }}
              >
                <Input
                  placeholder="Enter branch name"
                  onChange={handleNameChange}
                  style={{ width: "100%" }}
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                label="Slug"
                name="slug"
                rules={[
                  { required: true, message: "Please enter slug" },
                  {
                    pattern: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
                    message: "Slug must be lowercase with hyphens only",
                  },
                ]}
                style={{ marginBottom: 16 }}
              >
                <Input
                  placeholder="branch-slug"
                  disabled={isEditMode}
                  style={{ width: "100%" }}
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                label="Email"
                name="email"
                rules={[
                  { type: "email", message: "Please enter a valid email" },
                ]}
                style={{ marginBottom: 16 }}
              >
                <Input
                  placeholder="branch@example.com"
                  type="email"
                  style={{ width: "100%" }}
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                label="Phone Number"
                name="phone"
                rules={[
                  {
                    pattern: /^[0-9+\-\s()]+$/,
                    message: "Please enter a valid phone number",
                  },
                ]}
                style={{ marginBottom: 16 }}
              >
                <Input placeholder="+1 234 567 8900" style={{ width: "100%" }} />
              </Form.Item>
            </Col>

            <Col xs={24}>
              <Form.Item label="Address" name="address" style={{ marginBottom: 16 }}>
                <TextArea
                  placeholder="Enter branch address"
                  rows={4}
                  maxLength={500}
                  showCount
                  style={{ width: "100%" }}
                />
              </Form.Item>
            </Col>
          </Row>

          {!isViewMode && (
            <div className="flex justify-end gap-3 mt-6">
              <Button
                onClick={handleCancel}
                size="large"
                className="cancel-btn"
              >
                Cancel
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                loading={isSaving}
                className="primary-btn"
              >
                {isEditMode ? "Update Branch" : "Create Branch"}
              </Button>
            </div>
          )}
        </Form>
      </Card>
    </div>
  );
};

export default CreateAndUpdateBranch;
