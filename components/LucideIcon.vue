<template>
  <component :is="iconComponent" :size="size" :class="iconClass" />
</template>

<script setup>
import { computed } from 'vue'
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
  Bell
} from 'lucide-vue-next'

const props = defineProps({
  name: {
    type: String,
    required: true
  },
  size: {
    type: [String, Number],
    default: 20
  },
  class: {
    type: String,
    default: ''
  }
})

const iconClass = computed(() => props.class)

const iconMap = {
  'home': Home,
  'user-circle': UserCircle,
  'map': Map,
  'document-text': FileText,
  'signal': Signal,
  'archive-box': Archive,
  'building-office': Building,
  'currency-dollar': DollarSign,
  'arrow-path': RotateCcw,
  'credit-card': CreditCard,
  'ticket': Ticket,
  'users': Users,
  'chevron-down': ChevronDown,
  'log-out': LogOut,
  'settings': Settings,
  'bell': Bell
}

const iconComponent = computed(() => {
  return iconMap[props.name] || Home // fallback to Home icon
})
</script>
