<template>
    <component :is="iconComponent" :size="size" :class="iconClass" />
</template>

<script setup>
import { computed } from "vue";
import {
    Home,
    UserCircle,
    Map,
    FileText,
    Signal,
    Archive,
    Building,
    DollarSign,
    RotateCcw,
    CreditCard,
    Ticket,
    Users,
    ChevronDown,
    LogOut,
    Settings,
    Bell,
    Trash2,
    Pencil,
    Plus,
    MessageCircle,
    Download,
    EyeOff,
    Eye,
    RefreshCw,
    RotateCw,
    Edit,
    Printer,
    EllipsisVertical,
    X,
    Phone,
    Calendar,
    MapPin,
    Tag,
    Navigation,
    Building2,
    User,
    Check,
    Info,
    Wifi,
    Handshake,
} from "lucide-vue-next";

const props = defineProps({
    name: {
        type: String,
        required: true,
    },
    size: {
        type: [String, Number],
        default: 20,
    },
    class: {
        type: String,
        default: "",
    },
});

const iconClass = computed(() => props.class);

const iconMap = {
    home: Home,
    "user-circle": UserCircle,
    map: Map,
    "document-text": FileText,
    signal: Signal,
    "archive-box": Archive,
    "building-office": Building,
    "currency-dollar": DollarSign,
    "arrow-path": RotateCcw,
    "credit-card": CreditCard,
    ticket: Ticket,
    users: Users,
    "chevron-down": ChevronDown,
    "log-out": LogOut,
    settings: Settings,
    bell: Bell,
    trash: Trash2,
    "trash-2": Trash2,
    pencil: Pencil,
    plus: Plus,
    "message-circle": MessageCircle,
    download: Download,
    "eye-off": EyeOff,
    eye: Eye,
    "refresh-cw": RefreshCw,
    "rotate-cw": RotateCw,
    edit: Edit,
    printer: Printer,
    "ellipsis-vertical": EllipsisVertical,
    x: X,
    phone: Phone,
    calendar: Calendar,
    "map-pin": MapPin,
    tag: Tag,
    navigation: Navigation,
    "building-2": Building2,
    user: User,
    check: Check,
    info: Info,
    wifi: Wifi,
    handshake: Handshake,
};

const iconComponent = computed(() => {
    return iconMap[props.name] || Home; // fallback to Home icon
});
</script>
