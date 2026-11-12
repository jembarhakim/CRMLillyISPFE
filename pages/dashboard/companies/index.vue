<script setup lang="ts">
import LucideIcon from "@/components/LucideIcon.vue";
import { companyAdminApi } from "@/api/admin/company";
import AddCompanyForm from "./AddCompanyForm.vue";
// Set page title
useHead({
    title: "Company Management - CRM System",
});

let people: any[] = [];

const page = ref(1);
const pageCount = 5;

const q = ref("");
async function fetchAllCompanies() {
    await companyAdminApi()
        .getAllCompanies()
        .then((response) => {
            response.data.forEach((company: any) => {
                company.number = response.data.indexOf(company) + 1;
                company.logo_url =
                    company.logo_url || "https://via.placeholder.com/150";
            });
            people = [...response.data];
            q.value = "changed";
            q.value = "";
        })
        .catch((error) => {
            console.error("Error fetching companies:", error);
        });
}

await fetchAllCompanies();

type Person = {
    id: number;
    name: string;
    email: string;
    phone: string;
    address: string;
    area_code: string;
    packet_internet: string;
    ip_static: string;
    mac_address: string;
};

const columns = [
    {
        key: "number",
        label: "No",
    },
    {
        key: "name",
        label: "Name",
    },
    {
        key: "email",
        label: "Email",
    },
    {
        key: "url",
        label: "Website",
    },
    {
        key: "npwp",
        label: "NPWP",
    },
    {
        key: "address",
        label: "Address",
    },
    {
        key: "phone",
        label: "Phone",
    },
    {
        key: "logo_url",
        label: "Image",
    },
    {
        key: "actions",
        label: "Actions",
    },
];

let peopleData = people;

const filteredRows = computed(() => {
    if (!q.value) {
        peopleData = people;
        return people.slice(
            (page.value - 1) * pageCount,
            page.value * pageCount,
        );
    }

    const newData = people.filter((person) => {
        return Object.values(person).some((value) => {
            return String(value).toLowerCase().includes(q.value.toLowerCase());
        });
    });
    peopleData = newData;
    return newData.slice((page.value - 1) * pageCount, page.value * pageCount);
});

const isOpen = ref(false);

function openAddCompanyModal() {
    modal.open(AddCompanyForm, {
        onSuccess: handleSubmitCompany,
    });
}

function openEditCompanyModal(companyId: string) {
    modal.open(AddCompanyForm, {
        isEdit: true,
        id: companyId,
        onSuccess: handleSubmitCompany,
    });
}

async function handleSubmitCompany() {
    toast.add({
        title: "Success!",
        id: "modal-success",
    });

    await fetchAllCompanies();
    modal.close();
    isOpen.value = false;
}

async function deleteCompany(companyId: string) {
    const confirmed = window.confirm(
        "Are you sure you want to delete this company?",
    );
    if (!confirmed) return;

    try {
        await companyAdminApi().deleteCompany(companyId);
        toast.add({
            title: "Success!",
            id: "modal-success",
        });

        await fetchAllCompanies();
    } catch (error) {
        console.error("Error deleting company:", error);
    }
}

const items = (row: Person) => [
    [
        {
            label: "Edit",
            icon: "pencil-square-20-solid",
            click: () => openEditCompanyModal(row.id.toString()),
        },
    ],
    [
        {
            label: "Delete",
            icon: "trash-2-20-solid",
            click: () => deleteCompany(row.id.toString()),
        },
    ],
];

const toast = useCustomToast();
const modal = useModal();
</script>

<template>
    <div class="space-y-5">
        <AdminPageHeader
            title="Company"
            description="Kelola profil, kontak, dan informasi perusahaan."
            icon="building-2"
            eyebrow="Data Perusahaan"
        >
            <template #actions>
                <UButton label="Tambah Company" @click="() => openAddCompanyModal()">
                    <template #leading>
                        <LucideIcon name="plus" :size="16" />
                    </template>
                </UButton>
            </template>
        </AdminPageHeader>

        <section class="admin-data-panel">
            <div class="admin-data-toolbar">
                <div>
                    <h2 class="text-sm font-semibold text-gray-900">Daftar Company</h2>
                    <p class="mt-1 text-xs text-gray-500">{{ peopleData.length }} perusahaan terdaftar</p>
                </div>
                <UInput v-model="q" placeholder="Cari company..." class="w-full sm:max-w-xs" />
            </div>

            <div class="admin-data-table">
                <div class="table-scroll-container">
                    <div class="table-scroll-content company-table-scroll">
                        <UTable
                            :rows="filteredRows"
                            :columns="columns"
                            class="dashboard-table"
                        >
                            <template #logo_url-data="{ row }">
                                <UAvatar :src="row.logo_url" size="xl" />
                            </template>
                            <template #actions-data="{ row }">
                                <UDropdown :items="items(row)">
                                    <button
                                        type="button"
                                        class="bg-gray-700 text-white px-2 py-1 text-sm hover:bg-gray-600 rounded inline-flex items-center justify-center shadow-sm transition-colors duration-200 group"
                                        aria-label="Actions"
                                    >
                                        <LucideIcon
                                            name="ellipsis-vertical"
                                            class="text-white"
                                            :size="18"
                                        />
                                    </button>
                                </UDropdown>
                            </template>
                        </UTable>
                    </div>
                    <div class="table-scroll-footer">
                        <span class="scroll-hint">Scroll horizontally to view all company details.</span>
                    </div>
                </div>
            </div>

            <div class="flex justify-end border-t border-gray-100 px-4 py-3">
                <UPagination
                    v-model="page"
                    :page-count="pageCount"
                    :total="peopleData.length"
                />
            </div>
        </section>

        <UModal v-model="isOpen">
            <div class="p-4">
                <Placeholder class="h-48" />
                <AddCompanyForm />
            </div>
        </UModal>
    </div>
</template>
