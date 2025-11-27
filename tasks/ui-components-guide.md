# UI/UX Components - Usage Guide
## Eureka CMMS Enhanced User Interface

This document provides usage guidelines for the new UI/UX components created for Phase 5, Task 5.4.

---

## 📦 New Components

### 1. Toast Notification (`Toast.tsx`)

**Purpose:** Display temporary success/error messages to users

**Usage:**
```typescript
import Toast from './components/Toast';

const [toast, setToast] = useState<{message: string; type: 'success' | 'error'} | null>(null);

// Show toast
setToast({ message: 'Action completed successfully!', type: 'success' });

// Render
{toast && (
  <Toast
    message={toast.message}
    type={toast.type}
    onClose={() => setToast(null)}
    duration={3000}
  />
)}
```

**Props:**
- `message` (string): The message to display
- `type` ('success' | 'error'): Visual style
- `onClose` (function): Callback when toast closes
- `duration` (number, optional): Auto-close duration in ms (default: 3000)

**Features:**
- Auto-closes after duration
- Slide-in animation from right
- Click X to close manually
- Success: Green theme with CheckCircle icon
- Error: Red theme with XCircle icon

---

### 2. Loading Button (`LoadingButton.tsx`)

**Purpose:** Button with built-in loading state

**Usage:**
```typescript
import LoadingButton from './components/LoadingButton';
import { Save } from 'lucide-react';

<LoadingButton
  onClick={handleSave}
  loading={isSaving}
  disabled={!isValid}
  icon={Save}
  variant="primary"
>
  Save Changes
</LoadingButton>
```

**Props:**
- `onClick` (function): Click handler
- `loading` (boolean): Show loading spinner
- `disabled` (boolean): Disable button
- `children` (ReactNode): Button text
- `className` (string): Additional CSS classes
- `icon` (LucideIcon): Icon to display (hidden when loading)
- `type` ('button' | 'submit' | 'reset'): Button type
- `variant` ('primary' | 'secondary' | 'success' | 'danger'): Visual style

**Variants:**
- `primary`: Teal background (default)
- `secondary`: Gray background
- `success`: Green background
- `danger`: Red background

**Features:**
- Shows spinner when loading
- Automatically disabled when loading
- Icon automatically hidden when loading
- Smooth transitions

---

### 3. Empty State (`EmptyState.tsx`)

**Purpose:** Display helpful message when no data exists

**Usage:**
```typescript
import EmptyState from './components/EmptyState';
import { Package } from 'lucide-react';

<EmptyState
  icon={Package}
  title="No work orders found"
  description="Create your first work order to get started"
  action={{
    label: "Create Work Order",
    onClick: handleCreate
  }}
  type="info"
/>
```

**Props:**
- `icon` (LucideIcon): Icon to display (default: FileX)
- `title` (string): Main heading
- `description` (string, optional): Subtitle text
- `action` (object, optional): Action button
  - `label` (string): Button text
  - `onClick` (function): Click handler
- `type` ('default' | 'info' | 'success' | 'warning'): Visual theme

**Types:**
- `default`: Gray theme
- `info`: Blue theme
- `success`: Green theme
- `warning`: Amber theme

**Features:**
- Dashed border design
- Icon in circular badge
- Optional action button
- Fade-in animation

---

## 🎨 New CSS Classes (index.css)

### Animations

**Slide animations:**
- `.animate-slide-in-right` - Slides in from right
- `.animate-slide-out-right` - Slides out to right

**Fade animations:**
- `.animate-fade-in` - Fades in
- `.animate-fade-out` - Fades out

**Scale animations:**
- `.animate-scale-in` - Scales up with fade

**Special effects:**
- `.animate-bounce-subtle` - Gentle bounce
- `.animate-pulse-ring` - Pulsing ring effect
- `.animate-shimmer` - Shimmer loading effect

### Utility Classes

**Hover effects:**
- `.hover-lift` - Lifts element on hover with shadow

**Loading states:**
- `.spinner` - Rotating spinner
- `.skeleton` - Skeleton loading placeholder

**Scrollbar:**
- `.custom-scrollbar` - Styled thin scrollbar

**Interactive:**
- `.interactive` - Smooth hover/active states
- `.disabled` - Disabled appearance

**Tooltips:**
- `.tooltip` - Add `data-tooltip="text"` for tooltips

**Glass effect:**
- `.glass` - Glass morphism background

**Badge:**
- `.notification-badge` - Animated notification badge

---

## 🔧 Enhanced Components

### NotificationCenter (Updated)

**Improvements:**
1. **Animations**
   - Scale-in animation when opening
   - Fade-in for backdrop
   - Staggered item animations
   - Pulse effect on unread indicator

2. **Interactions**
   - Hover effects on notification items
   - Action buttons appear on hover
   - Scale animation on icon hover
   - Smooth transitions throughout

3. **Empty State**
   - Better visual design
   - "All caught up!" message
   - Dashed border circle

4. **Header**
   - Gradient background
   - Better badge styling
   - Loading state for "Mark all read"

5. **Accessibility**
   - Better contrast
   - Larger touch targets
   - Clear visual feedback

---

## 💡 Usage Examples

### Example 1: Toast with API Call

```typescript
const handleAssign = async () => {
  setIsAssigning(true);
  try {
    await updateWorkOrder(id, { assignedTo: technicianId });
    setToast({ 
      message: 'Technician assigned successfully!', 
      type: 'success' 
    });
  } catch (error) {
    setToast({ 
      message: 'Failed to assign technician', 
      type: 'error' 
    });
  } finally {
    setIsAssigning(false);
  }
};
```

### Example 2: Loading Button in Form

```typescript
<form onSubmit={handleSubmit}>
  <input type="text" value={value} onChange={e => setValue(e.target.value)} />
  
  <LoadingButton
    type="submit"
    loading={isSubmitting}
    disabled={!value.trim()}
    icon={Save}
    variant="primary"
  >
    Submit Form
  </LoadingButton>
</form>
```

### Example 3: Empty State with Filter

```typescript
const filteredItems = items.filter(item => item.status === filter);

{filteredItems.length === 0 ? (
  <EmptyState
    icon={Filter}
    title="No items match your filter"
    description="Try adjusting your filter criteria"
    type="info"
  />
) : (
  <ItemList items={filteredItems} />
)}
```

### Example 4: Tooltip Usage

```typescript
<button 
  className="tooltip"
  data-tooltip="Click to edit"
>
  <Edit size={16} />
</button>
```

---

## 🎯 Best Practices

### Toast Notifications

✅ **Do:**
- Use success for completed actions
- Use error for failures
- Keep messages brief and clear
- Auto-close after 3-5 seconds

❌ **Don't:**
- Show multiple toasts simultaneously
- Use for permanent information
- Make messages too long

### Loading States

✅ **Do:**
- Show loading spinner during async operations
- Disable buttons when loading
- Provide visual feedback
- Keep loading states brief

❌ **Don't:**
- Forget to reset loading state
- Block entire UI for small operations
- Use for instant operations

### Empty States

✅ **Do:**
- Explain why the state is empty
- Provide clear next action
- Use appropriate icons
- Keep messaging positive

❌ **Don't:**
- Show technical error messages
- Leave users without guidance
- Use alarming language

### Animations

✅ **Do:**
- Use subtle animations
- Keep duration under 300ms
- Test on slower devices
- Respect user motion preferences

❌ **Don't:**
- Overuse animations
- Make animations too slow
- Animate everything
- Use distracting effects

---

## 🚀 Performance Considerations

### Animation Performance

- All animations use CSS transforms (GPU-accelerated)
- No layout-triggering properties animated
- Animations are hardware-accelerated
- Short durations (< 400ms)

### Toast Management

- Only one toast shown at a time
- Auto-cleanup prevents memory leaks
- Minimal re-renders

### Component Optimization

- LoadingButton: Memoize icon components if needed
- EmptyState: Static rendering, no effects
- Toast: Auto-cleanup with useEffect

---

## 📱 Responsive Behavior

### Toast
- Fixed position, adapts to screen size
- min-width: 300px, max-width: md (28rem)
- Top-right placement on all screens

### Empty State
- Centers on screen
- max-width: md (28rem)
- Adapts padding on mobile

### Notification Panel
- Fixed width: 24rem (384px) on desktop
- Could be made responsive for mobile

---

## 🎨 Customization

### Changing Toast Colors

Edit `Toast.tsx`:
```typescript
const bgColor = type === 'success' 
  ? 'bg-your-color border-your-border' 
  : 'bg-error-color border-error-border';
```

### Adding Button Variant

Edit `LoadingButton.tsx`:
```typescript
const variantStyles = {
  // ...existing variants
  custom: 'bg-custom-color hover:bg-custom-hover text-white',
};
```

### Custom Animations

Add to `index.css`:
```css
@keyframes your-animation {
  from { /* start state */ }
  to { /* end state */ }
}

.animate-your-animation {
  animation: your-animation 0.3s ease-out;
}
```

---

## ✅ Testing Checklist

### Toast
- [ ] Appears correctly
- [ ] Auto-closes after duration
- [ ] Can be manually closed
- [ ] Success variant shows green
- [ ] Error variant shows red
- [ ] Animation smooth

### LoadingButton
- [ ] Shows spinner when loading
- [ ] Disabled when loading
- [ ] Icon hidden when loading
- [ ] All variants render correctly
- [ ] Click handler works
- [ ] Disabled state works

### EmptyState
- [ ] Renders correctly
- [ ] Icon displays
- [ ] Action button works
- [ ] All types render correctly
- [ ] Responsive on mobile

### Animations
- [ ] Smooth on desktop
- [ ] Smooth on mobile
- [ ] No jank or stutter
- [ ] Respects reduced motion

---

## 🔄 Migration Guide

### Replacing alert() with Toast

**Before:**
```typescript
alert('Action completed!');
```

**After:**
```typescript
setToast({ message: 'Action completed!', type: 'success' });
setTimeout(() => setToast(null), 3000);
```

### Replacing Basic Button with LoadingButton

**Before:**
```typescript
<button onClick={handleClick} disabled={isLoading}>
  {isLoading ? 'Loading...' : 'Click Me'}
</button>
```

**After:**
```typescript
<LoadingButton onClick={handleClick} loading={isLoading}>
  Click Me
</LoadingButton>
```

---

## 📚 References

- Tailwind CSS: https://tailwindcss.com
- Lucide Icons: https://lucide.dev
- CSS Animations: https://developer.mozilla.org/en-US/docs/Web/CSS/animation
- React Hooks: https://react.dev/reference/react

---

**Created:** Phase 5, Task 5.4 - UI/UX Polish  
**Version:** 1.0.0  
**Last Updated:** November 27, 2025
