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
                    <li>
                        Stake change percentage shown on Info Panel is calculated as: 
                            movement_amount / total_stake_in_previous_epoch
                    </li>
                </ul>
            </section>
        </main>
    )
}