module.exports = (req, res) => {
    res.send({
        // override: {
        //     url: 'https://www.youtube.com'
        // },
        webviewPages: [
            {
                url: 'https://grafana.internal.k8s-1.edgeofglory.net/d/TtebOn6mz/filebeats-proxy-monitor?refresh=5s&orgId=1&from=now-15m&to=now&kiosk=tv',
                viewDuration: 10,
                // scrollOverTime: {
                //     identifier: '.scroll-canvas.scroll-canvas--dashboard'
                // },
                onLoadSteps: [
                    {
                        step: 'waitForElement',
                        args: ['.login-form-input[name="username"]'],
                        if: {
                            url: 'https://grafana.internal.k8s-1.edgeofglory.net/login'
                        }
                    },
                    {
                        step: 'type',
                        args: [
                            '.login-form-input[name="username"]',
                            'viewer'
                        ],
                        if: {
                            url: 'https://grafana.internal.k8s-1.edgeofglory.net/login'
                        }
                    },
                    {
                        step: 'type',
                        args: [
                            '.login-form-input[name="password"]',
                            'Rqj8g6zE;QeDc6nnCxp^4Js*T[j'
                        ],
                        if: {
                            url: 'https://grafana.internal.k8s-1.edgeofglory.net/login'
                        }
                    },
                    {
                        step: 'click',
                        args: [
                            '.login-button-group button'
                        ],
                        if: {
                            url: 'https://grafana.internal.k8s-1.edgeofglory.net/login'
                        }
                    }
                ]
            },
            {
                url: 'https://i.imgur.com/BPYHOh8.jpg',
                viewDuration: 10,
            },
            {
                url: 'https://i.imgur.com/D2ajYXo.jpg',
                viewDuration: 10,
            }
            // {
            //     url: 'https://google.com',
            //     viewDuration: 10,
            // },
            // {
            //     url: 'https://npmjs.com',
            //     viewDuration: 10,
            //     scrollOverTime: true,
            // },
        ]
    })
}