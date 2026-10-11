import { redirect } from 'next/navigation'

// Rewards live in the wallet now: two Wolfie's, earned as you walk.
export default function RewardsPage() {
  redirect('/wallet')
}
