<template>
  <div class="container">
    <a-layout style="padding: 0 18px">
      <Breadcrumb :items="[$t('menu.admin'), $t('menu.admin.sysRole')]" />
      <a-card :title="$t('menu.admin.sysRole')" class="general-card">
        <a-row>
          <a-col :span="12">
            <a-form
              :auto-label-width="true"
              :label-col-props="{ span: 6 }"
              :model="formModel"
              label-align="right"
            >
              <a-row>
                <a-col :span="12">
                  <a-form-item :label="$t('admin.role.form.name')" field="name">
                    <a-input
                      v-model="formModel.name"
                      :placeholder="$t('admin.role.form.name.placeholder')"
                    />
                  </a-form-item>
                </a-col>
                <a-col :span="12">
                  <a-form-item
                    :label="$t('admin.role.form.status')"
                    field="status"
                  >
                    <a-select
                      v-model="formModel.status"
                      :options="statusOptions"
                      :placeholder="$t('admin.role.form.selectDefault')"
                      allow-clear
                      @clear="resetStatus"
                    />
                  </a-form-item>
                </a-col>
              </a-row>
            </a-form>
          </a-col>
          <a-divider direction="vertical" style="height: 30px" />
          <a-col :span="8">
            <a-space :size="'medium'" direction="horizontal">
              <a-button type="primary" @click="search">
                <template #icon>
                  <icon-search />
                </template>
                {{ $t('admin.role.form.search') }}
              </a-button>
              <a-button @click="resetSelect">
                <template #icon>
                  <icon-refresh />
                </template>
                {{ $t('admin.role.form.reset') }}
              </a-button>
            </a-space>
          </a-col>
        </a-row>
        <a-divider />
        <a-space :size="'medium'">
          <a-button type="primary" @click="NewRole">
            <template #icon>
              <icon-plus />
            </template>
            {{ $t('admin.role.button.create') }}
          </a-button>
          <a-button
            :disabled="deleteButtonStatus()"
            status="danger"
            @click="DeleteRole"
          >
            <template #icon>
              <icon-minus />
            </template>
            {{ $t('admin.role.button.delete') }}
          </a-button>
        </a-space>
        <a-alert :type="'warning'" style="margin-top: 20px">
          {{ $t('admin.role.alert.data_scope') }}
        </a-alert>
        <div class="content">
          <a-table
            v-model:selected-keys="rowSelectKeys"
            :bordered="false"
            :columns="columns"
            :data="renderData"
            :loading="loading"
            :pagination="pagination"
            :row-selection="rowSelection"
            :size="'medium'"
            row-key="id"
            @page-change="onPageChange"
            @page-size-change="onPageSizeChange"
          >
            <template #index="{ rowIndex }">
              {{ rowIndex + 1 }}
            </template>
            <template #status="{ record }">
              <a-tag v-if="record.status === 1" :color="`green`" bordered>
                {{ $t(`admin.menu.form.status.${record.status}`) }}
              </a-tag>
              <a-tag v-else :color="`red`" bordered>
                {{ $t(`admin.menu.form.status.${record.status}`) }}
              </a-tag>
            </template>
            <template #operate="{ record }">
              <a-space>
                <a-link @click="EditPerm(record.id)">
                  {{ $t(`admin.role.columns.perms`) }}
                </a-link>
                <a-link @click="EditRole(record.id)">
                  {{ $t(`admin.role.columns.edit`) }}
                </a-link>
              </a-space>
            </template>
          </a-table>
        </div>
        <div class="content-modal">
          <a-modal
            :closable="false"
            :on-before-ok="beforeSubmit"
            :title="drawerTitle"
            :visible="openNewOrEdit"
            :width="550"
            @cancel="cancelReq"
            @ok="submitNewOrEdit"
          >
            <a-form ref="formRef" :model="form">
              <a-form-item
                :label="$t('admin.role.columns.name')"
                :rules="[
                  {
                    required: true,
                    message: $t('admin.role.form.name.help'),
                  },
                ]"
                field="name"
              >
                <a-input v-model="form.name"></a-input>
              </a-form-item>
              <a-form-item
                :label="$t('admin.role.columns.status')"
                field="status"
              >
                <a-switch
                  v-model="switchStatus"
                  :checked-text="$t('switch.open')"
                  :unchecked-text="$t('switch.close')"
                ></a-switch>
              </a-form-item>
              <a-form-item
                :label="$t('admin.role.columns.remark')"
                field="remark"
              >
                <a-textarea v-model="form.remark"></a-textarea>
              </a-form-item>
            </a-form>
          </a-modal>
          <a-modal
            :closable="false"
            :title="`${$t('modal.title.tips')}`"
            :visible="openDelete"
            @cancel="cancelReq"
            @ok="submitDeleteRole"
          >
            <a-space>
              <icon-exclamation-circle-fill size="24" style="color: #e6a23c" />
              {{ $t('admin.role.modal.delete') }}
            </a-space>
          </a-modal>
          <a-drawer
            :closable="false"
            :header="false"
            :title="drawerTitle"
            :visible="openEditPerm"
            :width="688"
            @cancel="cancelReq"
            @ok="submitPerms"
          >
            <a-tabs
              v-model:active-key="activePerm"
              :animation="true"
              :justify="true"
              :type="'card-gutter'"
            >
              <a-tab-pane
                key="menu"
                :closable="false"
                :title="$t('admin.role.drawer.menu')"
              >
                <a-space :size="'medium'" style="margin: 10px 0 20px 20px">
                  <a-button
                    :shape="'round'"
                    :type="'outline'"
                    @click="checkMenu"
                  >
                    {{ $t('admin.role.drawer.menu.button.select') }}
                  </a-button>
                  <a-button :shape="'round'" :type="'outline'" @click="expand">
                    {{ $t('admin.role.drawer.menu.button.collapse') }}
                  </a-button>
                </a-space>
                <a-scrollbar style="height: 530px; overflow: auto">
                  <a-tree
                    ref="menuTreeDataRef"
                    v-model:checked-keys="menuCheckedKeys"
                    :checkable="true"
                    :data="menuTreeData"
                    :field-names="selectMenuTreeFieldNames"
                    style="margin-left: 20px"
                  ></a-tree>
                </a-scrollbar>
              </a-tab-pane>
              <a-tab-pane
                key="api"
                :closable="false"
                :title="$t('admin.role.drawer.api')"
              >
                <a-space :size="'medium'" style="margin: 10px 0 20px 20px">
                  <a-button
                    :shape="'round'"
                    :type="'outline'"
                    @click="checkApi"
                  >
                    {{ $t('admin.role.drawer.menu.button.select') }}
                  </a-button>
                </a-space>
                <a-scrollbar style="height: 530px; overflow: auto">
                  <a-tree
                    ref="apiDataRef"
                    v-model:checked-keys="apiCheckedKeys"
                    :checkable="true"
                    :data="apiData"
                    :field-names="selectApiFieldNames"
                    style="margin-left: 10px"
                  ></a-tree>
                </a-scrollbar>
              </a-tab-pane>
              <a-tab-pane
                key="data-rule"
                :closable="false"
                :title="$t('admin.role.drawer.dataRule')"
              >
                <a-space :size="'medium'" style="margin: 10px 0 20px 20px">
                  <a-button
                    :shape="'round'"
                    :type="'outline'"
                    @click="checkDataRule"
                  >
                    {{ $t('admin.role.drawer.menu.button.select') }}
                  </a-button>
                </a-space>
                <a-scrollbar style="height: 530px; overflow: auto">
                  <a-tree
                    ref="DataRuleRef"
                    v-model:checked-keys="dataRuleCheckedKeys"
                    :checkable="true"
                    :data="dataRuleData"
                    :field-names="selectDataRuleFieldNames"
                    style="margin-left: 10px"
                  ></a-tree>
                </a-scrollbar>
              </a-tab-pane>
            </a-tabs>
          </a-drawer>
        </div>
      </a-card>
    </a-layout>
  </div>
  <div class="footer">
    <Footer />
  </div>
</template>

<script lang="ts" setup>
  import { computed, reactive, ref, watch } from 'vue';
  import {
    Message,
    SelectOptionData,
    TableColumnData,
    TreeFieldNames,
  } from '@arco-design/web-vue';
  import { useI18n } from 'vue-i18n';
  import Breadcrumb from '@/components/breadcrumb/index.vue';
  import Footer from '@/components/footer/index.vue';
  import useLoading from '@/hooks/loading';
  import {
    createSysRole,
    deleteSysRole,
    querySysMenuTreeBySysRole,
    querySysRoleDetail,
    querySysRoleList,
    querySysRoleRuleBySysRole,
    SysRoleParams,
    SysRoleReq,
    SysRoleRes,
    updateSysRole,
    updateSysRoleDataRule,
    updateSysRoleMenu,
  } from '@/api/role';
  import { Pagination } from '@/types/global';
  import {
    querySysMenuTree,
    SysMenuTreeParams,
    SysMenuTreeRes,
  } from '@/api/menu';
  import { querySysApiAll, SysApiRes } from '@/api/api';
  import {
    CasbinPoliciesDel,
    CasbinPoliciesReq,
    CasbinPolicyReq,
    createCasbinPolicies,
    createCasbinPolicy,
    deleteCasbinPolicies,
    queryCasbinPoliciesByRole,
  } from '@/api/casbin';
  import { querySysDataRuleAll } from '@/api/data-rule';

  const { t } = useI18n();
  const { loading, setLoading } = useLoading(true);

  // 表单
  const generateFormModel = () => {
    return {
      name: undefined,
      status: undefined,
    };
  };
  const formModel = ref(generateFormModel());
  const statusOptions = computed<SelectOptionData[]>(() => [
    {
      label: t('admin.role.form.status.1'),
      value: 1,
    },
    {
      label: t('admin.role.form.status.0'),
      value: 0,
    },
  ]);

  // 表格
  const renderData = ref<SysRoleRes[]>([]);
  const rowSelectKeys = ref<number[]>([]);
  const rowSelection = reactive({
    showCheckedAll: true,
    selectedRowKeys: rowSelectKeys.value,
  });
  const basePagination: Pagination = {
    current: 1,
    defaultPageSize: 20,
    showTotal: true,
    showPageSize: true,
    bufferSize: 3,
  };
  const pagination: Pagination = reactive({
    ...basePagination,
  });
  const operateRow = ref<number>(0);
  const NewRole = () => {
    buttonStatus.value = 'new';
    drawerTitle.value = t('admin.role.columns.new.drawer');
    resetForm(formDefaultValues);
    switchStatus.value = true;
    openNewOrEdit.value = true;
  };
  const DeleteRole = () => {
    drawerTitle.value = t('admin.role.columns.delete.drawer');
    openDelete.value = true;
  };
  const EditPerm = async (pk: number) => {
    operateRow.value = pk;
    activePerm.value = 'menu';
    await fetchMenuTree();
    await fetchRoleMenuTree();
    menuCheckedKeys.value = [];
    fetchMenuCheckedKeys(menuTreeDataByRole.value);
    openEditPerm.value = true;
  };
  const EditRole = async (pk: number) => {
    buttonStatus.value = 'edit';
    operateRow.value = pk;
    drawerTitle.value = t('admin.role.columns.edit.drawer');
    await fetchRoleDetail(pk);
    openNewOrEdit.value = true;
  };
  const columns = computed<TableColumnData[]>(() => [
    {
      title: 'ID',
      dataIndex: 'index',
      slotName: 'index',
      ellipsis: true,
      tooltip: true,
      width: 100,
    },
    {
      title: t('admin.role.columns.name'),
      dataIndex: 'name',
      slotName: 'name',
    },
    {
      title: t('admin.role.columns.status'),
      dataIndex: 'status',
      slotName: 'status',
      align: 'center',
    },
    {
      title: t('admin.role.columns.remark'),
      dataIndex: 'remark',
      slotName: 'remark',
      ellipsis: true,
      tooltip: true,
    },
    {
      title: t('admin.role.columns.created_time'),
      dataIndex: 'created_time',
      slotName: 'created_time',
    },
    {
      title: t('admin.role.columns.operate'),
      dataIndex: 'operate',
      slotName: 'operate',
      align: 'center',
    },
  ]);

  // 对话框
  const openNewOrEdit = ref<boolean>(false);
  const drawerTitle = ref<string>('');
  const openDelete = ref<boolean>(false);
  const openEditPerm = ref<boolean>(false);
  const formRef = ref();
  const cancelReq = () => {
    openNewOrEdit.value = false;
    openDelete.value = false;
    openEditPerm.value = false;
  };
  const formDefaultValues: SysRoleReq = {
    name: '',
    data_scope: 1,
    status: 1,
    remark: undefined,
  };
  const form = reactive<SysRoleReq>({ ...formDefaultValues });
  const buttonStatus = ref<string>();
  const switchStatus = ref<boolean>(true);

  // 抽屉
  const menuCheckedKeys = ref<number[]>([]);
  const apiCheckedKeys = ref<number[]>([]);
  const dataRuleCheckedKeys = ref<number[]>([]);
  const menuTreeData = ref();
  const apiData = ref();
  const dataRuleData = ref();
  const casbinPolicies = ref();
  const menuTreeDataByRole = ref();

  const selectMenuTreeFieldNames: TreeFieldNames = {
    key: 'id',
    title: 'title',
    children: 'children',
    icon: 'iconRender',
  };
  const selectApiFieldNames: TreeFieldNames = {
    key: 'id',
    title: 'name',
    children: 'children',
  };
  const selectDataRuleFieldNames: TreeFieldNames = {
    key: 'id',
    title: 'name',
    children: 'children',
  };
  const expandAll = ref<boolean>(false);
  const checkAll = ref<boolean>(false);
  const menuTreeDataRef = ref();
  const apiDataRef = ref();
  const DataRuleRef = ref();
  const activePerm = ref<string>('menu');
  const submitPerms = async () => {
    if (activePerm.value === 'menu') {
      await submitRoleMenu();
    } else if (activePerm.value === 'api') {
      await submitRoleApi();
    } else if (activePerm.value === 'data-rule') {
      await submitRoleDataRule();
    }
  };

  // 表单校验
  const beforeSubmit = async (done: any) => {
    const res = await formRef.value?.validate();
    if (!res) {
      done(true);
    }
    done(false);
  };

  // 提交按钮
  const submitNewOrEdit = async () => {
    setLoading(true);
    try {
      if (buttonStatus.value === 'new') {
        await createSysRole(form);
        cancelReq();
        Message.success(t('submit.create.success'));
        await fetchRoleList();
      } else {
        await updateSysRole(operateRow.value, form);
        cancelReq();
        Message.success(t('submit.update.success'));
        await fetchRoleList();
      }
    } catch (error) {
      // console.log(error);
    } finally {
      setLoading(false);
    }
  };

  // 删除角色
  const submitDeleteRole = async () => {
    setLoading(true);
    try {
      await deleteSysRole({ pk: rowSelectKeys.value });
      cancelReq();
      Message.success(t('submit.delete.success'));
      await fetchRoleList();
      rowSelectKeys.value = [];
    } catch (error) {
      openDelete.value = false;
      // console.log(error);
    } finally {
      openDelete.value = false;
      setLoading(false);
    }
  };

  // 请求角色列表
  const fetchRoleList = async (params: SysRoleParams = {}) => {
    setLoading(true);
    try {
      const res = await querySysRoleList(params);
      renderData.value = res.items;
      pagination.total = res.total;
      pagination.current = params.page;
    } catch (error) {
      // console.log(error);
    } finally {
      setLoading(false);
    }
  };
  fetchRoleList();

  // 请求菜单树
  const fetchMenuTree = async (params: SysMenuTreeParams = {}) => {
    setLoading(true);
    try {
      menuTreeData.value = await querySysMenuTree(params);
    } catch (error) {
      // console.log(error);
    } finally {
      setLoading(false);
    }
  };

  // 请求角色菜单树
  const fetchRoleMenuTree = async () => {
    setLoading(true);
    try {
      menuTreeDataByRole.value = await querySysMenuTreeBySysRole(
        operateRow.value
      );
    } catch (error) {
      // console.log(error);
    } finally {
      setLoading(false);
    }
  };

  // 请求角色详情
  const fetchRoleDetail = async (pk: number) => {
    setLoading(true);
    try {
      const res = await querySysRoleDetail(pk);
      resetForm(res);
      switchStatus.value = Boolean(res.status);
    } catch (error) {
      // console.log(error);
    } finally {
      setLoading(false);
    }
  };

  // 请求API数据
  const fetchApiData = async () => {
    try {
      apiData.value = await querySysApiAll();
    } catch (error) {
      // console.log(error);
    }
  };

  // 请求数据规则数据
  const fetchDataRuleData = async () => {
    try {
      dataRuleData.value = await querySysDataRuleAll();
    } catch (error) {
      // console.log(error)
    }
  };

  // 请求Casbin所有P规则
  const fetchCasbinPolicies = async () => {
    try {
      casbinPolicies.value = await queryCasbinPoliciesByRole(operateRow.value);
    } catch (error) {
      // console.log(error);
    }
  };

  // 更新角色菜单
  const submitRoleMenu = async () => {
    try {
      if (menuCheckedKeys.value.length > 0) {
        checkedParentNode(menuTreeDataRef.value.getCheckedNodes('all'));
      }
      await updateSysRoleMenu(operateRow.value, {
        menus: menuCheckedKeys.value,
      });
      cancelReq();
      Message.success(t('submit.update.success'));
    } catch (error) {
      // console.log(error);
    }
  };

  // 更新角色API
  const submitRoleApi = async () => {
    try {
      if (casbinPolicies.value.length > 0) {
        await submitDeleteCasbinPolicies({ role: String(operateRow.value) });
      }
      // eslint-disable-next-line array-callback-return,consistent-return
      const policies: CasbinPolicyReq[] = [];
      apiData.value.forEach((item: SysApiRes) => {
        if (apiCheckedKeys.value.includes(item.id)) {
          policies.push({
            sub: String(operateRow.value),
            path: item.path,
            method: item.method,
          });
        }
      });
      if (policies.length === 1) {
        await submitCasbinPolicy({
          sub: policies[0].sub,
          path: policies[0].path,
          method: policies[0].method,
        });
      } else if (policies.length > 1) {
        await submitCasbinPolicies({ ps: policies });
      }
      cancelReq();
      Message.success(t('submit.update.success'));
    } catch (error) {
      // console.log(error);
    }
  };

  // 添加角色Casbin的P规则
  const submitCasbinPolicy = async (data: CasbinPolicyReq) => {
    try {
      await createCasbinPolicy(data);
    } catch (error) {
      // console.log(error);
    }
  };

  // 添加多组角色Casbin的P规则
  const submitCasbinPolicies = async (data: CasbinPoliciesReq) => {
    try {
      await createCasbinPolicies(data);
    } catch (error) {
      // console.log(error);
    }
  };

  // 删除角色Casbin所有P规则
  const submitDeleteCasbinPolicies = async (data: CasbinPoliciesDel) => {
    try {
      await deleteCasbinPolicies(data);
    } catch (error) {
      // console.log(error);
    }
  };

  // 更新角色数据规则
  const submitRoleDataRule = async () => {
    try {
      if (menuCheckedKeys.value.length > 0) {
        checkedParentNode(menuTreeDataRef.value.getCheckedNodes('all'));
      }
      await updateSysRoleDataRule(operateRow.value, {
        rules: dataRuleCheckedKeys.value,
      });
      cancelReq();
      Message.success(t('submit.update.success'));
    } catch (error) {
      // console.log(error);
    }
  };

  // 遍历选中角色菜单父节点
  const checkedParentNode = (data: SysMenuTreeRes[]) => {
    data.forEach((item: SysMenuTreeRes) => {
      if (item.parent_id) {
        if (!menuCheckedKeys.value.includes(item.parent_id)) {
          menuCheckedKeys.value.push(item.parent_id);
        }
      }
      if (item.children && item.children.length > 0) {
        checkedParentNode(item.children);
      }
    });
  };

  // 获取菜单选中节点
  const fetchMenuCheckedKeys = (data: SysMenuTreeRes[]) => {
    data.forEach((item: SysMenuTreeRes) => {
      const menuCheckedKey = item.id;
      if (item.children && item.children.length > 0) {
        fetchMenuCheckedKeys(item.children);
      }
      menuCheckedKeys.value.push(menuCheckedKey);
    });
  };

  // 获取API选中节点
  const fetchApiCheckedKeys = (policies: any[]) => {
    const apiDataFormat: string[] = apiData.value.map((item: SysApiRes) => {
      return `${item.id}:${item.path}:${item.method}`;
    });
    // eslint-disable-next-line array-callback-return
    apiDataFormat.findIndex((item: string) => {
      policies.forEach((policy: string[]) => {
        const ruleFormat = `${policy[1]}:${policy[2]}`;
        if (item.includes(ruleFormat)) {
          apiCheckedKeys.value.push(Number(item.split(':')[0]));
        }
      });
    });
  };

  // 获取数据规则选中节点
  const fetchDataRuleCheckedKeys = async (pk: number) => {
    const data = await querySysRoleRuleBySysRole(pk);
    dataRuleCheckedKeys.value.push(...data);
  };

  // 事件: 分页
  const onPageChange = async (current: number) => {
    await fetchRoleList({ page: current, size: pagination.pageSize });
  };

  // 事件: 分页大小
  const onPageSizeChange = async (pageSize: number) => {
    pagination.pageSize = pageSize;
    await fetchRoleList({ page: 1, size: pageSize });
  };

  // 搜索
  const search = async () => {
    await fetchRoleList({
      ...formModel.value,
    } as unknown as SysRoleParams);
  };

  // 重置
  const resetSelect = () => {
    formModel.value = generateFormModel();
  };

  // 重置状态
  const resetStatus = () => {
    formModel.value.status = undefined;
  };

  // 删除按钮状态
  const deleteButtonStatus = () => {
    return rowSelectKeys.value?.length === 0;
  };

  // 重置表单
  const resetForm = (data: Record<any, any>) => {
    Object.keys(data).forEach((key) => {
      // @ts-ignore
      form[key] = data[key];
    });
  };

  // 全选/取消全选
  const checkMenu = () => {
    checkAll.value = !checkAll.value;
    menuTreeDataRef.value.checkAll(checkAll.value);
  };
  const checkApi = () => {
    checkAll.value = !checkAll.value;
    apiDataRef.value.checkAll(checkAll.value);
  };
  const checkDataRule = () => {
    checkAll.value = !checkAll.value;
    DataRuleRef.value.checkAll(checkAll.value);
  };

  // 展开/收起
  const expand = () => {
    expandAll.value = !expandAll.value;
    menuTreeDataRef.value.expandAll(expandAll.value);
  };

  // 监听角色API标签选择
  watch(
    () => activePerm.value,
    async (val) => {
      if (val === 'api') {
        apiCheckedKeys.value = [];
        await fetchApiData();
        await fetchCasbinPolicies();
        fetchApiCheckedKeys(casbinPolicies.value);
      }
      if (val === 'data-rule') {
        dataRuleCheckedKeys.value = [];
        await fetchDataRuleData();
        await fetchDataRuleCheckedKeys(operateRow.value);
      }
    },
    {
      deep: true,
    }
  );

  watch(
    () => switchStatus.value,
    (val) => {
      form.status = val ? 1 : 0;
    }
  );
</script>

<script lang="ts">
  export default {
    name: 'SysRole',
  };
</script>

<style lang="less" scoped>
  .content {
    padding-top: 20px;
  }
</style>
