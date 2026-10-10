<template>
    <aside aria-label="Customer Support WhatsApp">
        <!-- Tombol Mengambang di Pojok Kanan Bawah -->
        <button @click="openWhatsapp"
            class="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-2xl transition-all duration-300 transform hover:scale-110 group focus:outline-none focus:ring-4 focus:ring-green-300"
            title="Hubungi Kami via WhatsApp">
            <!-- Efek Ping / Pulse Gelombang Halus -->
            <span
                class="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75 animate-ping -z-10 group-hover:hidden"></span>

            <!-- Icon WhatsApp (FontAwesome / SVG) -->
            <i class="fab fa-whatsapp text-3xl"></i>
        </button>
    </aside>
</template>

<script setup>
// Props opsional jika nomor ingin dinamis / dioper dari luar
const props = defineProps({
    phoneNumber: {
        type: String,
        default: '6285607121775' // Ganti nomor CS Lilly ISP
    },
    defaultMessage: {
        type: String,
        default: 'Halo Lilly ISP, saya ingin bertanya seputar layanan internet.'
    }
})

const openWhatsapp = () => {
    const url = `https://wa.me/${props.phoneNumber}?text=${encodeURIComponent(props.defaultMessage)}`
    window.open(url, '_blank')
}
</script>