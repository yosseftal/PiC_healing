import {
  AtomicActionLayout,
  type ActionDescriptor,
  type ActionTuple,
  type BannerDescriptor,
  type BannerTuple,
} from "./AtomicActionLayout";

const action: ActionDescriptor = {
  kind: "button",
  label: "Continue",
  intent: "primary",
  onAction: () => undefined,
};

const banner: BannerDescriptor = {
  id: "support",
  intent: "neutral",
  content: "Supportive context.",
};

const acceptedActions: ActionTuple = [action, action];
const acceptedBanners: BannerTuple = [banner, banner];

<AtomicActionLayout
  primaryContent={<p>One calm focus.</p>}
  actions={acceptedActions}
  banners={acceptedBanners}
/>;

const threeActions = [action, action, action] as const;
// @ts-expect-error -- Atomic Focus rejects a third main-frame action.
const rejectedActions: ActionTuple = threeActions;

const threeBanners = [banner, banner, banner] as const;
// @ts-expect-error -- Atomic Focus rejects a third main-frame banner.
const rejectedBanners: BannerTuple = threeBanners;

void rejectedActions;
void rejectedBanners;
