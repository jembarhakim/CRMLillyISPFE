# TypeScript Error Fix - Company Selection Form

## Issue
TypeScript error occurred when implementing company selection in the customer form:

```
[vue-tsc] Type '{ label: any; value: any; }[]' is not assignable to type 'never[]'. 
Type '{ label: any; value: any; }' is not assignable to type 'never'.
```

## Root Cause
The error occurred because TypeScript couldn't infer the correct type for the `companies` ref when it was initialized with an empty array `[]`. TypeScript inferred the type as `never[]` instead of the expected object array type.

## Solution
Added explicit type annotations to all dropdown option refs in `FormAddComponent.vue`:

### Before (Causing Error):
```typescript
const internet_packages = ref([]);
const areas = ref([]);
const salesRepresentatives = ref([]);
const companies = ref([]);
```

### After (Fixed):
```typescript
const internet_packages = ref<{label: string, value: string}[]>([]);
const areas = ref<{label: string, value: string}[]>([]);
const salesRepresentatives = ref<{label: string, value: string}[]>([]);
const companies = ref<{label: string, value: string}[]>([]);
```

## Technical Details

### Type Definition
The type `{label: string, value: string}[]` represents an array of objects where each object has:
- `label`: string - The display text for the dropdown option
- `value`: string - The actual value to be submitted

### Why This Fix Works
1. **Explicit Type Declaration**: TypeScript now knows exactly what type of data these refs will contain
2. **Consistent Interface**: All dropdown options follow the same structure
3. **Type Safety**: Prevents runtime errors from incorrect data structures
4. **Better IntelliSense**: IDE can provide better autocomplete and error checking

### Usage in Template
The typed refs work seamlessly with USelectMenu components:
```vue
<USelectMenu 
  v-model="state.company_id" 
  :options="companies" 
  value-attribute="value"
  option-attribute="label"
  placeholder="Pilih company (optional)"
/>
```

## Benefits

### For Development
- ✅ **No TypeScript errors** during compilation
- ✅ **Better type safety** for dropdown data
- ✅ **Improved IntelliSense** support
- ✅ **Consistent data structure** across all dropdowns

### For Runtime
- ✅ **Prevents type-related bugs** at runtime
- ✅ **Ensures data consistency** in dropdown options
- ✅ **Better error handling** for malformed data

## Related Files
- **File**: `crm-fe/pages/dashboard/customer/FormAddComponent.vue`
- **Lines**: 289-292
- **Component**: Customer form with company selection

## Testing
After the fix:
1. ✅ **TypeScript compilation** passes without errors
2. ✅ **Form functionality** works as expected
3. ✅ **Company dropdown** populates correctly
4. ✅ **Data submission** includes company_id field

## Best Practices Applied
1. **Explicit Type Annotations**: Always specify types for refs that will hold complex data
2. **Consistent Data Structure**: Use the same `{label, value}` structure for all dropdowns
3. **Type Safety**: Leverage TypeScript's type system to prevent runtime errors
4. **Maintainable Code**: Clear type definitions make code easier to understand and maintain

## Conclusion
The TypeScript error has been resolved by adding explicit type annotations to the dropdown option refs. This ensures type safety while maintaining the functionality of the company selection feature in the customer form.
