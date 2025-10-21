/* Direct container of the bubble map */
export default function About() 
{
    return (
        <main className="bg-white dark:bg-gray-900 dark:text-gray-900">
            <section>
                <h1 className="text-4xl pb-5">Important points</h1>
                <ul className="text-base list-disc list-inside space-y-2 text-gray-200">
                    <li>
                        Minimum epoch for visualization is 210, as it marks the start of the Shelley era, where decentralisation was introduced on Cardano.
                    </li>
                    <li>4-epoch delegation cycle
                        <ul>
                            <li>Epoch N: Delegation certificate created for delegation.</li>
                            <li>Epoch N+1: Snapshot of stake in pool including that delegation is recorded (in epoch_stake).</li>
                            <li>Epoch N+2: Stake is ACTIVE. This stake is now used block production calculation.</li>
                            <li>Epoch N+3: Rewards are calculated based on the N+2 snapshot.</li>
                            <li>Epoch N+4: Calculated rewards are distributed at the start of the epoch.</li>
                        </ul>
                    </li>
                    <li>
                        Stake change percentage shown on Info Panel is calculated as: 
                            movement_amount / total_stake_in_previous_epoch
                    </li>
                    <li>
                        Saturation ratio is calculated using (stake_held_by_pool / (total_active_stake_in_epoch / optimal_pool_count_in_epoch)) AS saturation_ratio
                    </li>
                    <li>
                        Delegation types
                        <ul>
                            <li>REDELEGATION: Delegator moves delegation from one pool to another.</li>
                            <li>NEW_STAKE: When the delegator is new, and hence, has never delegated to a pool before.</li>
                            <li>AWAITING_CONFIRMATION: When in an intermediate epoch where the delegation is awaiting to be confirmed.</li>
                            <li>UNDELEGATED</li>
                            <li>NO_CHANGE</li>
                        </ul>
                    </li>
                </ul>
            </section>
        </main>
    )
}