import 'dotenv/config';
import { RingApi, RingIntercom } from 'ring-client-api';
import { readFile, writeFile } from 'fs';
import { promisify } from 'util';

async function main() {
    const { env } = process;
    const ringApi = new RingApi({
        refreshToken: env.RING_REFRESH_TOKEN!,
        // Listen for dings and motion events
        cameraStatusPollingSeconds: 2,
    });
    const locations = await ringApi.getLocations();
    const devices = await ringApi.fetchRingDevices();

    let mainIntercom: RingIntercom | undefined;

    console.log(
        `Found ${locations.length} location(s)`
    )

    console.log(
        `Found ${devices.intercoms.length} intercom(s)`
    )

    locations.forEach((location) => {
        location.intercoms.forEach((intercom) => {
            intercom.onDing.subscribe(() => {
                console.log(
                    `Ding from ${intercom.name} at ${location.name} )`
                )
            });

            mainIntercom = intercom;
        });
    });

    setTimeout(() => {
        if (mainIntercom) {
            mainIntercom.unlock().then(() => {
                console.log('Unlocked the door for 2 sec 👻')
            });
        }
    }, 2000)

    devices.intercoms.forEach((intercom) => {
        console.log(`- ${intercom.device_id} 👉 (${intercom.battery_life})`)
    })

    ringApi.onRefreshTokenUpdated.subscribe(
        async ({ newRefreshToken, oldRefreshToken }) => {
            console.log('Refresh Token Updated: ', newRefreshToken)

            // If you are implementing a project that use `ring-client-api`, you should subscribe to onRefreshTokenUpdated and update your config each time it fires an event
            // Here is an example using a .env file for configuration
            if (!oldRefreshToken) {
                return
            }

            const currentConfig = await promisify(readFile)('.env');
            const updatedConfig = currentConfig
                .toString()
                .replace(oldRefreshToken, newRefreshToken)

            await promisify(writeFile)('.env', updatedConfig)
        }
    )
}

main()