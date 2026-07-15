<script setup lang="ts">
import { ref } from "vue";
import {
  Button,
  Dialog,
  Sheet,
  Popover,
  PopoverTrigger,
  PopoverContent,
  Tooltip,
  ToastRegion,
  useToast,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuContextTrigger,
} from "@stance/core";

const { show } = useToast();

const dialogOpen = ref(false);
const sheetOpen = ref(false);
const popoverOpen = ref(false);
const menuOpen = ref(false);
const contextMenuOpen = ref(false);
const lastAction = ref("(none)");
</script>

# Overlays showcase

Every overlay family in one page — Dialog, Popover, Tooltip, Toast, Sheet,
and DropdownMenu's context-menu mode. These all teleport their content
outside this page's DOM subtree and pick up the ambient palette/density from
the nav picker via `useOverlayThemeContext`, so opening any of them proves
that mechanism works, not just that the trigger button is styled correctly.

<!--
  Every component below teleports via a shared overlay root and reads
  `document`/`window` inside its positioning and focus-trap composables at
  setup time — a real, pre-existing SSR gap (see Layout.vue's comment on
  ThemePicker) that predates this page and is out of scope to fix here.
  ClientOnly is the same pragmatic sidestep used there: this page has
  nothing meaningful to server-render anyway, since every example only
  matters once it's interactive.
-->
<ClientOnly>
<div class="stance-showcase-overlays">
  <ToastRegion />
  <div class="stance-showcase-overlays__group">
    <h3 class="stance-showcase-overlays__label">Dialog</h3>
    <Button @click="dialogOpen = true">Edit profile</Button>
    <Dialog v-model="dialogOpen" title="Edit profile" description="Update your account details below.">
      <p class="stance-showcase-overlays__body">Dialog body content goes here.</p>
      <div class="stance-showcase-overlays__actions">
        <Button variant="secondary" @click="dialogOpen = false">Cancel</Button>
        <Button @click="dialogOpen = false">Save</Button>
      </div>
    </Dialog>
  </div>
  <div class="stance-showcase-overlays__group">
    <h3 class="stance-showcase-overlays__label">Sheet</h3>
    <Button @click="sheetOpen = true">Open filters</Button>
    <Sheet v-model="sheetOpen" side="right" title="Filters" description="Narrow down the results below.">
      <p class="stance-showcase-overlays__body">Sheet body content goes here.</p>
      <div class="stance-showcase-overlays__actions">
        <Button variant="secondary" @click="sheetOpen = false">Cancel</Button>
        <Button @click="sheetOpen = false">Apply</Button>
      </div>
    </Sheet>
  </div>
  <div class="stance-showcase-overlays__group">
    <h3 class="stance-showcase-overlays__label">Popover</h3>
    <Popover v-model="popoverOpen">
      <PopoverTrigger>Show info</PopoverTrigger>
      <PopoverContent>
        <p>Non-modal content anchored to the trigger.</p>
      </PopoverContent>
    </Popover>
  </div>
  <div class="stance-showcase-overlays__group">
    <h3 class="stance-showcase-overlays__label">Tooltip</h3>
    <Tooltip content="Saves your changes">
      <Button variant="secondary">Save</Button>
    </Tooltip>
  </div>
  <div class="stance-showcase-overlays__group">
    <h3 class="stance-showcase-overlays__label">Toast</h3>
    <div class="stance-showcase-overlays__actions">
      <Button size="sm" @click="show({ title: 'Saved', description: 'Your changes were saved.' })">Default</Button>
      <Button size="sm" variant="destructive" @click="show({ title: 'Payment failed', variant: 'destructive' })">
        Destructive
      </Button>
    </div>
  </div>
  <div class="stance-showcase-overlays__group">
    <h3 class="stance-showcase-overlays__label">DropdownMenu</h3>
    <DropdownMenu v-model="menuOpen">
      <DropdownMenuTrigger>Actions</DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem @select="lastAction = 'Edit'">Edit</DropdownMenuItem>
        <DropdownMenuItem @select="lastAction = 'Duplicate'">Duplicate</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" @select="lastAction = 'Delete'">Delete</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
    <p class="stance-showcase-overlays__hint">Last action: {{ lastAction }}</p>
  </div>
  <div class="stance-showcase-overlays__group">
    <h3 class="stance-showcase-overlays__label">DropdownMenu (context-menu mode)</h3>
    <DropdownMenu v-model="contextMenuOpen">
      <DropdownMenuContextTrigger v-slot="{ onContextmenu, onTouchstart, onTouchmove, onTouchend, onTouchcancel }">
        <div
          tabindex="0"
          class="stance-showcase-overlays__context-target"
          @contextmenu="onContextmenu"
          @touchstart="onTouchstart"
          @touchmove="onTouchmove"
          @touchend="onTouchend"
          @touchcancel="onTouchcancel"
        >
          Right-click (or long-press) here
        </div>
      </DropdownMenuContextTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem @select="lastAction = 'Edit'">Edit</DropdownMenuItem>
        <DropdownMenuItem @select="lastAction = 'Duplicate'">Duplicate</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" @select="lastAction = 'Delete'">Delete</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>
</div>
</ClientOnly>
<style>
.stance-showcase-overlays {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(14rem, 1fr));
  gap: 1.5rem;
}

.stance-showcase-overlays__group {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.5rem;
}

.stance-showcase-overlays__label {
  font-size: 0.875rem;
  font-weight: 600;
}

.stance-showcase-overlays__body {
  margin-bottom: 1rem;
}

.stance-showcase-overlays__actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

.stance-showcase-overlays__hint {
  font-size: 0.875rem;
  opacity: 0.7;
}

.stance-showcase-overlays__context-target {
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px dashed var(--stance-color-border);
  border-radius: var(--stance-radius-md);
  padding: 2rem 1rem;
  font-size: 0.875rem;
  user-select: none;
}
</style>
