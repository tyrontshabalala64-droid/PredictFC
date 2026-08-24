 import React from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Shield } from 'lucide-react'

export default function Privacy() {
    const navigate = useNavigate()

    // Your Termly Privacy Policy HTML content as a string
    const privacyContent = `
        <style>
            [data-custom-class='body'], [data-custom-class='body'] * {
                background: transparent !important;
            }
            [data-custom-class='title'], [data-custom-class='title'] * {
                font-family: Arial !important;
                font-size: 26px !important;
                color: #000000 !important;
            }
            [data-custom-class='subtitle'], [data-custom-class='subtitle'] * {
                font-family: Arial !important;
                color: #595959 !important;
                font-size: 14px !important;
            }
            [data-custom-class='heading_1'], [data-custom-class='heading_1'] * {
                font-family: Arial !important;
                font-size: 19px !important;
                color: #000000 !important;
            }
            [data-custom-class='heading_2'], [data-custom-class='heading_2'] * {
                font-family: Arial !important;
                font-size: 17px !important;
                color: #000000 !important;
            }
            [data-custom-class='body_text'], [data-custom-class='body_text'] * {
                color: #595959 !important;
                font-size: 14px !important;
                font-family: Arial !important;
            }
            [data-custom-class='link'], [data-custom-class='link'] * {
                color: #3030F1 !important;
                font-size: 14px !important;
                font-family: Arial !important;
                word-break: break-word !important;
            }
            ul {
                list-style-type: square;
            }
            ul > li > ul {
                list-style-type: circle;
            }
            ul > li > ul > li > ul {
                list-style-type: square;
            }
            ol li {
                font-family: Arial ;
            }
        </style>

        <span style="display: block;margin: 0 auto 3.125rem;width: 11.125rem;height: 2.375rem;background: url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNzgiIGhlaWdodD0iMzgiIHZpZXdCb3g9IjAgMCAxNzggMzgiPgogICAgPGcgZmlsbD0ibm9uZSIgZmlsbC1ydWxlPSJldmVub2RkIj4KICAgICAgICA8cGF0aCBmaWxsPSIjRDFEMUQxIiBkPSJNNC4yODMgMjQuMTA3Yy0uNzA1IDAtMS4yNTgtLjI1Ni0xLjY2LS43NjhoLS4wODVjLjA1Ny41MDIuMDg2Ljc5Mi4wODYuODd2Mi40MzRILjk4NXYtOC42NDhoMS4zMzJsLjIzMS43NzloLjA3NmMuMzgzLS41OTQuOTUtLjg5MiAxLjcwMi0uODkyLjcxIDAgMS4yNjQuMjc0IDEuNjY1LjgyMi40MDEuNTQ4LjYwMiAxLjMwOS42MDIgMi4yODMgMCAuNjQtLjA5NCAxLjE5OC0uMjgyIDEuNjctLjE4OC40NzMtLjQ1Ni44MzMtLjgwMyAxLjA4LS4zNDcuMjQ3LS43NTYuMzctMS4yMjUuMzd6TTMuOCAxOS4xOTNjLS40MDUgMC0uNy4xMjQtLjg4Ni4zNzMtLjE4Ny4yNDktLjI4My42Ni0uMjkgMS4yMzN2LjE3N2MwIC42NDUuMDk1IDEuMTA3LjI4NyAxLjM4Ni4xOTIuMjguNDk1LjQxOS45MS40MTkuNzM0IDAgMS4xMDEtLjYwNSAxLjEwMS0xLjgxNiAwLS41OS0uMDktMS4wMzQtLjI3LTEuMzI5LS4xODItLjI5NS0uNDY1LS40NDMtLjg1Mi0uNDQzem01LjU3IDEuNzk0YzAgLjU5NC4wOTggMS4wNDQuMjkzIDEuMzQ4LjE5Ni4zMDQuNTEzLjQ1Ny45NTQuNDU3LjQzNyAwIC43NS0uMTUyLjk0Mi0uNDU0LjE5Mi0uMzAzLjI4OC0uNzUzLjI4OC0xLjM1MSAwLS41OTUtLjA5Ny0xLjA0LS4yOS0xLjMzOC0uMTk0LS4yOTctLjUxLS40NDUtLjk1LS40NDUtLjQzOCAwLS43NTMuMTQ3LS45NDYuNDQzLS4xOTQuMjk1LS4yOS43NDItLjI5IDEuMzR6bTQuMTUzIDBjMCAuOTc3LS4yNTggMS43NDItLjc3NCAyLjI5My0uNTE1LjU1Mi0xLjIzMy44MjctMi4xNTQuODI3LS41NzYgMC0xLjA4NS0uMTI2LTEuNTI1LS4zNzhhMi41MiAyLjUyIDAgMCAxLTEuMDE1LTEuMDg4Yy0uMjM3LS40NzMtLjM1NS0xLjAyNC0uMzU1LTEuNjU0IDAtLjk4MS4yNTYtMS43NDQuNzY4LTIuMjg4LjUxMi0uNTQ1IDEuMjMyLS44MTcgMi4xNi0uODE3LjU3NiAwIDEuMDg1LjEyNiAxLjUyNS4zNzYuNDQuMjUxLjc3OS42MSAxLjAxNSAxLjA4LjIzNi40NjkuMzU1IDEuMDE5LjM1NSAxLjY0OXpNMTkuNzEgMjRsLS40NjItMi4xLS42MjMtMi42NTNoLS4wMzdMMTcuNDkzIDI0SDE1LjczbC0xLjcwOC02LjAwNWgxLjYzM2wuNjkzIDIuNjU5Yy4xMS40NzYuMjI0IDEuMTMzLjMzOCAxLjk3MWguMDMyYy4wMTUtLjI3Mi4wNzctLjcwNC4xODgtMS4yOTRsLjA4Ni0uNDU3Ljc0Mi0yLjg3OWgxLjgwNGwuNzA0IDIuODc5Yy4wMTQuMDc5LjAzNy4xOTUuMDY3LjM1YTIwLjk5OCAyMC45OTggMCAwIDEgLjE2NyAxLjAwMmMuMDIzLjE2NS4wMzYuMjk5LjA0LjM5OWguMDMyYy4wMzItLjI1OC4wOS0uNjExLjE3Mi0xLjA2LjA4Mi0uNDUuMTQxLS43NTQuMTc3LS45MTFsLjcyLTIuNjU5aDEuNjA2TDIxLjQ5NCAyNGgtMS43ODN6bTcuMDg2LTQuOTUyYy0uMzQ4IDAtLjYyLjExLS44MTcuMzMtLjE5Ny4yMi0uMzEuNTMzLS4zMzguOTM3aDIuMjk5Yy0uMDA4LS40MDQtLjExMy0uNzE3LS4zMTctLjkzNy0uMjA0LS4yMi0uNDgtLjMzLS44MjctLjMzem0uMjMgNS4wNmMtLjk2NiAwLTEuNzIyLS4yNjctMi4yNjYtLjgtLjU0NC0uNTM0LS44MTYtMS4yOS0uODE2LTIuMjY3IDAtMS4wMDcuMjUxLTEuNzg1Ljc1NC0yLjMzNC41MDMtLjU1IDEuMTk5LS44MjUgMi4wODctLjgyNS44NDggMCAxLjUxLjI0MiAxLjk4Mi43MjUuNDcyLjQ4NC43MDkgMS4xNTIuNzA5IDIuMDA0di43OTVoLTMuODczYy4wMTguNDY1LjE1Ni44MjkuNDE0IDEuMDkuMjU4LjI2MS42Mi4zOTIgMS4wODUuMzkyLjM2MSAwIC43MDMtLjAzNyAxLjAyNi0uMTEzYTUuMTMzIDUuMTMzIDAgMCAwIDEuMDEtLjM2djEuMjY4Yy0uMjg3LjE0My0uNTkzLjI1LS45Mi4zMmE1Ljc5IDUuNzkgMCAwIDEtMS4xOTEuMTA0em03LjI1My02LjIyNmMuMjIyIDAgLjQwNi4wMTYuNTUzLjA0OWwtLjEyNCAxLjUzNmExLjg3NyAxLjg3NyAwIDAgMC0uNDgzLS4wNTRjLS41MjMgMC0uOTMuMTM0LTEuMjIyLjQwMy0uMjkyLjI2OC0uNDM4LjY0NC0uNDM4IDEuMTI4VjI0aC0xLjYzOHYtNi4wMDVoMS4yNGwuMjQyIDEuMDFoLjA4Yy4xODctLjMzNy40MzktLjYwOC43NTYtLjgxNGExLjg2IDEuODYgMCAwIDEgMS4wMzQtLjMwOXptNC4wMjkgMS4xNjZjLS4zNDcgMC0uNjIuMTEtLjgxNy4zMy0uMTk3LjIyLS4zMS41MzMtLjMzOC45MzdoMi4yOTljLS4wMDctLjQwNC0uMTEzLS43MTctLjMxNy0uOTM3LS4yMDQtLjIyLS40OC0uMzMtLjgyNy0uMzN6bS4yMyA1LjA2Yy0uOTY2IDAtMS43MjItLjI2Ny0yLjI2Ni0uOC0uNTQ0LS41MzQtLjgxNi0xLjI5LS44MTYtMi4yNjcgMC0xLjAwNy4yNTEtMS43ODUuNzU0LTIuMzM0LjUwNC0uNTUgMS4yLS44MjUgMi4wODctLjgyNS44NDkgMCAxLjUxLjI0MiAxLjk4Mi43MjUuNDczLjQ4NC43MDkgMS4xNTIuNzA5IDIuMDA0di43OTVoLTMuODczYy4wMTguNDY1LjE1Ni44MjkuNDE0IDEuMDkuMjU4LjI2MS42Mi4zOTIgMS4wODUuMzkyLjM2MiAwIC43MDQtLjAzNyAxLjAyNi0uMTEzYTUuMTMzIDUuMTMzIDAgMCAwIDEuMDEtLjM2djEuMjY4Yy0uMjg3LjE0My0uNTkzLjI1LS45MTkuMzJhNS43OSA1Ljc5IDAgMCAxLTEuMTkyLjEwNHptNS44MDMgMGMtLjcwNiAwLTEuMjYtLjI3NS0xLjY2My0uODIyLS40MDMtLjU0OC0uNjA0LTEuMzA3LS42MDQtMi4yNzggMC0uOTg0LjIwNS0xLjc1Mi42MTUtMi4zMDEuNDEtLjU1Ljk3NS0uODI1IDEuNjk1LS44MjUuNzU1IDAgMS4zMzIuMjk0IDEuNzI5Ljg4MWguMDU0YTYuNjk3IDYuNjk3IDAgMCAxLS4xMjQtMS4xOTh2LTEuOTIyaDEuNjQ0VjI0SDQ2LjQzbC0uMzE3LS43NzloLS4wN2MtLjM3Mi41OTEtLjk0Ljg4Ni0xLjcwMi44ODZ6bS41NzQtMS4zMDZjLjQyIDAgLjcyNi0uMTIxLjkyMS0uMzY1LjE5Ni0uMjQzLjMwMi0uNjU3LjMyLTEuMjR2LS4xNzhjMC0uNjQ0LS4xLTEuMTA2LS4yOTgtMS4zODYtLjE5OS0uMjc5LS41MjItLjQxOS0uOTctLjQxOWEuOTYyLjk2MiAwIDAgMC0uODUuNDY1Yy0uMjAzLjMxLS4zMDQuNzYtLjMwNCAxLjM1IDAgLjU5Mi4xMDIgMS4wMzUuMzA2IDEuMzMuMjA0LjI5Ni40OTYuNDQzLjg3NS40NDN6bTEwLjkyMi00LjkyYy43MDkgMCAxLjI2NC4yNzcgMS42NjUuODMuNC41NTMuNjAxIDEuMzEyLjYwMSAyLjI3NSAwIC45OTItLjIwNiAxLjc2LS42MiAyLjMwNC0uNDE0LjU0NC0uOTc3LjgxNi0xLjY5LjgxNi0uNzA1IDAtMS4yNTgtLjI1Ni0xLjY1OS0uNzY4aC0uMTEzbC0uMjc0LjY2MWgtMS4yNTF2LTguMzU3aDEuNjM4djEuOTQ0YzAgLjI0Ny0uMDIxLjY0My0uMDY0IDEuMTg3aC4wNjRjLjM4My0uNTk0Ljk1LS44OTIgMS43MDMtLjg5MnptLS41MjcgMS4zMWMtLjQwNCAwLS43LjEyNS0uODg2LjM3NC0uMTg2LjI0OS0uMjgzLjY2LS4yOSAxLjIzM3YuMTc3YzAgLjY0NS4wOTYgMS4xMDcuMjg3IDEuMzg2LjE5Mi4yOC40OTUuNDE5LjkxLjQxOS4zMzcgMCAuNjA1LS4xNTUuODA0LS40NjUuMTk5LS4zMS4yOTgtLjc2LjI5OC0xLjM1IDAtLjU5MS0uMS0xLjAzNS0uMy0xLjMzYS45NDMuOTQzIDAgMCAwLS44MjMtLjQ0M3ptMy4xODYtMS4xOTdoMS43OTRsMS4xMzQgMy4zNzljLjA5Ni4yOTMuMTYzLjY0LjE5OCAxLjA0MmguMDMzYy4wMzktLjM3LjExNi0uNzE3LjIzLTEuMDQybDEuMTEyLTMuMzc5aDEuNzU3bC0yLjU0IDYuNzczYy0uMjM0LjYyNy0uNTY2IDEuMDk2LS45OTcgMS40MDctLjQzMi4zMTItLjkzNi40NjgtMS41MTIuNDY4LS4yODMgMC0uNTYtLjAzLS44MzMtLjA5MnYtMS4zYTIuOCAyLjggMCAwIDAgLjY0NS4wN2MuMjkgMCAuNTQzLS4wODguNzYtLjI2Ni4yMTctLjE3Ny4zODYtLjQ0NC41MDgtLjgwM2wuMDk2LS4yOTUtMi4zODUtNS45NjJ6Ii8+CiAgICAgICAgPGcgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoNzMpIj4KICAgICAgICAgICAgPGNpcmNsZSBjeD0iMTkiIGN5PSIxOSIgcj0iMTkiIGZpbGw9IiNFMEUwRTAiLz4KICAgICAgICAgICAgPHBhdGggZmlsbD0iI0ZGRiIgZD0iTTIyLjQ3NCAxNS40NDNoNS4xNjJMMTIuNDM2IDMwLjRWMTAuMzYzaDE1LjJsLTUuMTYyIDUuMDh6Ii8+CiAgICAgICAgPC9nPgogICAgICAgIDxwYXRoIGZpbGw9IiNEMkQyRDIiIGQ9Ik0xMjEuNTQ0IDE0LjU2di0xLjcyOGg4LjI3MnYxLjcyOGgtMy4wMjRWMjRoLTIuMjR2LTkuNDRoLTMuMDA4em0xMy43NDQgOS41NjhjLTEuMjkgMC0yLjM0MS0uNDE5LTMuMTUyLTEuMjU2LS44MS0uODM3LTEuMjE2LTEuOTQ0LTEuMjE2LTMuMzJzLjQwOC0yLjQ3NyAxLjIyNC0zLjMwNGMuODE2LS44MjcgMS44NzItMS4yNCAzLjE2OC0xLjI0czIuMzYuNDAzIDMuMTkyIDEuMjA4Yy44MzIuODA1IDEuMjQ4IDEuODggMS4yNDggMy4yMjQgMCAuMzEtLjAyMS41OTctLjA2NC44NjRoLTYuNDY0Yy4wNTMuNTc2LjI2NyAxLjA0LjY0IDEuMzkyLjM3My4zNTIuODQ4LjUyOCAxLjQyNC41MjguNzc5IDAgMS4zNTUtLjMyIDEuNzI4LS45NmgyLjQzMmEzLjg5MSAzLjg5MSAwIDAgMS0xLjQ4OCAyLjA2NGMtLjczNi41MzMtMS42MjcuOC0yLjY3Mi44em0xLjQ4LTYuNjg4Yy0uNC0uMzUyLS44ODMtLjUyOC0xLjQ0OC0uNTI4cy0xLjAzNy4xNzYtMS40MTYuNTI4Yy0uMzc5LjM1Mi0uNjA1LjgyMS0uNjggMS40MDhoNC4xOTJjLS4wMzItLjU4Ny0uMjQ4LTEuMDU2LS42NDgtMS40MDh6bTcuMDE2LTIuMzA0djEuNTY4Yy41OTctMS4xMyAxLjQ2MS0xLjY5NiAyLjU5Mi0xLjY5NnYyLjMwNGgtLjU2Yy0uNjcyIDAtMS4xNzkuMTY4LTEuNTIuNTA0LS4zNDEuMzM2LS41MTIuOTE1LS41MTIgMS43MzZWMjRoLTIuMjU2di04Ljg2NGgyLjI1NnptNi40NDggMHYxLjMyOGMuNTY1LS45NyAxLjQ4My0xLjQ1NiAyLjc1Mi0xLjQ1Ni42NzIgMCAxLjI3Mi4xNTUgMS44LjQ2NC41MjguMzEuOTM2Ljc1MiAxLjIyNCAxLjMyOC4zMS0uNTU1LjczMy0uOTkyIDEuMjcyLTEuMzEyYTMuNDg4IDMuNDg4IDAgMCAxIDEuODE2LS40OGMxLjA1NiAwIDEuOTA3LjMzIDIuNTUyLjk5Mi42NDUuNjYxLjk2OCAxLjU5Ljk2OCAyLjc4NFYyNGgtMi4yNHYtNC44OTZjMC0uNjkzLS4xNzYtMS4yMjQtLjUyOC0xLjU5Mi0uMzUyLS4zNjgtLjgzMi0uNTUyLTEuNDQtLjU1MnMtMS4wOS4xODQtMS40NDguNTUyYy0uMzU3LjM2OC0uNTM2Ljg5OS0uNTM2IDEuNTkyVjI0aC0yLjI0di00Ljg5NmMwLS42OTMtLjE3Ni0xLjIyNC0uNTI4LTEuNTkyLS4zNTItLjM2OC0uODMyLS41NTItMS40NC0uNTUycy0xLjA5LjE4NC0xLjQ0OC41NTJjLS4zNTcuMzY4LS41MzYuODk5LS41MzYgMS41OTJWMjRoLTIuMjU2di04Ljg2NGgyLjI1NnpNMTY0LjkzNiAyNFYxMi4xNmgyLjI1NlYyNGgtMi4yNTZ6bTcuMDQtLjE2bC0zLjQ3Mi04LjcwNGgyLjUyOGwyLjI1NiA2LjMwNCAyLjM4NC02LjMwNGgyLjM1MmwtNS41MzYgMTMuMDU2aC0yLjM1MmwxLjg0LTQuMzUyeiIvPgogICAgPC9nPgo8L3N2Zz4K) center no-repeat;"></span>

        <div data-custom-class="body">
            <div>
                <strong>
                    <span style="font-size: 26px;">
                        <span data-custom-class="title">
                            <h1>PRIVACY POLICY</h1>
                        </span>
                    </span>
                </strong>
            </div>
            <div>
                <span style="color: rgb(127, 127, 127);">
                    <strong>
                        <span style="font-size: 15px;">
                            <span data-custom-class="subtitle">Last updated August 07, 2026</span>
                        </span>
                    </strong>
                </span>
            </div>

            <div style="line-height: 1.5;">
                <span style="color: rgb(127, 127, 127);">
                    <span style="color: rgb(89, 89, 89); font-size: 15px;">
                        <span data-custom-class="body_text">
                            This Privacy Notice for <strong>Footballa</strong> describes how and why we might access, collect, store, use, and/or share your personal information when you use our services.
                        </span>
                    </span>
                </span>
            </div>

            <div style="line-height: 1.5;">
                <br>
            </div>

            <div style="line-height: 1.5;">
                <strong>
                    <span style="font-size: 15px;">
                        <span data-custom-class="heading_1">
                            <h2>SUMMARY OF KEY POINTS</h2>
                        </span>
                    </span>
                </strong>
            </div>

            <div style="line-height: 1.5;">
                <span style="font-size: 15px;">
                    <span data-custom-class="body_text">
                        <strong>What personal information do we process?</strong> When you visit, use, or navigate our Services, we may process personal information depending on how you interact with us and the Services.
                    </span>
                </span>
            </div>

            <div style="line-height: 1.5;">
                <br>
            </div>

            <div style="line-height: 1.5;">
                <span style="font-size: 15px;">
                    <span data-custom-class="body_text">
                        <strong>Do we process any sensitive personal information?</strong> We do not process sensitive personal information.
                    </span>
                </span>
            </div>

            <div style="line-height: 1.5;">
                <br>
            </div>

            <div style="line-height: 1.5;">
                <span style="font-size: 15px;">
                    <span data-custom-class="body_text">
                        <strong>How do we process your information?</strong> We process your information to provide, improve, and administer our Services, communicate with you, for security and fraud prevention, and to comply with law.
                    </span>
                </span>
            </div>

            <div style="line-height: 1.5;">
                <br>
            </div>

            <div style="line-height: 1.5;">
                <span style="font-size: 15px;">
                    <span data-custom-class="body_text">
                        <strong>What are your rights?</strong> Depending on where you are located geographically, the applicable privacy law may mean you have certain rights regarding your personal information.
                    </span>
                </span>
            </div>

            <div style="line-height: 1.5;">
                <br>
            </div>

            <div id="infocollect" style="line-height: 1.5;">
                <span style="color: rgb(0, 0, 0);">
                    <span style="color: rgb(0, 0, 0); font-size: 15px;">
                        <span style="font-size: 15px; color: rgb(0, 0, 0);">
                            <span style="font-size: 15px; color: rgb(0, 0, 0);">
                                <span id="control" style="color: rgb(0, 0, 0);">
                                    <strong>
                                        <span data-custom-class="heading_1">
                                            <h2>1. WHAT INFORMATION DO WE COLLECT?</h2>
                                        </span>
                                    </strong>
                                </span>
                            </span>
                        </span>
                    </span>
                </span>
                <span data-custom-class="heading_2" style="color: rgb(0, 0, 0);">
                    <span style="font-size: 15px;">
                        <strong>
                            <h3>Personal information you disclose to us</h3>
                        </strong>
                    </span>
                </span>
                <span style="color: rgb(127, 127, 127);">
                    <span style="color: rgb(89, 89, 89); font-size: 15px;">
                        <span data-custom-class="body_text">
                            <span style="font-size: 15px; color: rgb(89, 89, 89);">
                                <span style="font-size: 15px; color: rgb(89, 89, 89);">
                                    <span data-custom-class="body_text">
                                        <strong>
                                            <em>In Short:</em>
                                        </strong>
                                    </span>
                                </span>
                            </span>
                            <span data-custom-class="body_text">
                                <span style="font-size: 15px; color: rgb(89, 89, 89);">
                                    <span style="font-size: 15px; color: rgb(89, 89, 89);">
                                        <span data-custom-class="body_text">
                                            <em> We collect personal information that you provide to us.</em>
                                        </span>
                                    </span>
                                </span>
                            </span>
                        </span>
                    </span>
                </span>
            </div>

            <div style="line-height: 1.5;">
                <br>
            </div>

            <div style="line-height: 1.5;">
                <span style="font-size: 15px; color: rgb(89, 89, 89);">
                    <span style="font-size: 15px; color: rgb(89, 89, 89);">
                        <span data-custom-class="body_text">
                            We collect personal information that you voluntarily provide to us when you register on the Services, express an interest in obtaining information about us or our products and Services, when you participate in activities on the Services, or otherwise when you contact us.
                        </span>
                    </span>
                </span>
            </div>

            <div style="line-height: 1.5;">
                <br>
            </div>

            <div style="line-height: 1.5;">
                <span style="font-size: 15px; color: rgb(89, 89, 89);">
                    <span style="font-size: 15px; color: rgb(89, 89, 89);">
                        <span data-custom-class="body_text">
                            <strong>Personal Information Provided by You.</strong> The personal information that we collect depends on the context of your interactions with us and the Services, the choices you make, and the products and features you use. The personal information we collect may include the following:
                        </span>
                    </span>
                </span>
            </div>

            <ul>
                <li data-custom-class="body_text" style="line-height: 1.5;">
                    <span style="font-size: 15px; color: rgb(89, 89, 89);">
                        <span style="font-size: 15px; color: rgb(89, 89, 89);">
                            <span data-custom-class="body_text">names</span>
                        </span>
                    </span>
                </li>
                <li data-custom-class="body_text" style="line-height: 1.5;">
                    <span style="font-size: 15px; color: rgb(89, 89, 89);">
                        <span style="font-size: 15px; color: rgb(89, 89, 89);">
                            <span data-custom-class="body_text">phone numbers</span>
                        </span>
                    </span>
                </li>
                <li data-custom-class="body_text" style="line-height: 1.5;">
                    <span style="font-size: 15px; color: rgb(89, 89, 89);">
                        <span style="font-size: 15px; color: rgb(89, 89, 89);">
                            <span data-custom-class="body_text">email addresses</span>
                        </span>
                    </span>
                </li>
                <li data-custom-class="body_text" style="line-height: 1.5;">
                    <span style="font-size: 15px; color: rgb(89, 89, 89);">
                        <span style="font-size: 15px; color: rgb(89, 89, 89);">
                            <span data-custom-class="body_text">usernames</span>
                        </span>
                    </span>
                </li>
                <li data-custom-class="body_text" style="line-height: 1.5;">
                    <span style="font-size: 15px; color: rgb(89, 89, 89);">
                        <span style="font-size: 15px; color: rgb(89, 89, 89);">
                            <span data-custom-class="body_text">passwords</span>
                        </span>
                    </span>
                </li>
                <li data-custom-class="body_text" style="line-height: 1.5;">
                    <span style="font-size: 15px; color: rgb(89, 89, 89);">
                        <span style="font-size: 15px; color: rgb(89, 89, 89);">
                            <span data-custom-class="body_text">contact or authentication data</span>
                        </span>
                    </span>
                </li>
                <li data-custom-class="body_text" style="line-height: 1.5;">
                    <span style="font-size: 15px; color: rgb(89, 89, 89);">
                        <span style="font-size: 15px; color: rgb(89, 89, 89);">
                            <span data-custom-class="body_text">contact preferences</span>
                        </span>
                    </span>
                </li>
            </ul>

            <div style="line-height: 1.5;">
                <span style="font-size: 15px;">
                    <span data-custom-class="body_text">
                        <strong>Sensitive Information.</strong> We do not process sensitive information.
                    </span>
                </span>
            </div>

            <div style="line-height: 1.5;">
                <br>
            </div>

            <div style="line-height: 1.5;">
                <span style="font-size: 15px;">
                    <span data-custom-class="body_text">
                        <strong>Application Data.</strong> If you use our application(s), we also may collect the following information if you choose to provide us with access or permission:
                    </span>
                </span>
            </div>

            <ul>
                <li data-custom-class="body_text" style="line-height: 1.5;">
                    <span style="font-size: 15px;">
                        <span data-custom-class="body_text">
                            <em>Mobile Device Data.</em> We automatically collect device information (such as your mobile device ID, model, and manufacturer), operating system, version information and system configuration information, device and application identification numbers, browser type and version, hardware model Internet service provider and/or mobile carrier, and Internet Protocol (IP) address (or proxy server).
                        </span>
                    </span>
                </li>
                <li data-custom-class="body_text" style="line-height: 1.5;">
                    <span style="font-size: 15px;">
                        <span data-custom-class="body_text">
                            <em>Push Notifications.</em> We may request to send you push notifications regarding your account or certain features of the application(s). If you wish to opt out from receiving these types of communications, you may turn them off in your device's settings.
                        </span>
                    </span>
                </li>
            </ul>

            <div style="line-height: 1.5;">
                <span style="font-size: 15px;">
                    <span data-custom-class="body_text">
                        This information is primarily needed to maintain the security and operation of our application(s), for troubleshooting, and for our internal analytics and reporting purposes.
                    </span>
                </span>
            </div>

            <div style="line-height: 1.5;">
                <br>
            </div>

            <div style="line-height: 1.5;">
                <span style="font-size: 15px; color: rgb(89, 89, 89);">
                    <span style="font-size: 15px; color: rgb(89, 89, 89);">
                        <span data-custom-class="body_text">
                            All personal information that you provide to us must be true, complete, and accurate, and you must notify us of any changes to such personal information.
                        </span>
                    </span>
                </span>
            </div>

            <div style="line-height: 1.5;">
                <br>
            </div>

            <div style="line-height: 1.5;">
                <span data-custom-class="heading_2" style="color: rgb(0, 0, 0);">
                    <span style="font-size: 15px;">
                        <strong>
                            <h3>Information automatically collected</h3>
                        </strong>
                    </span>
                </span>
                <span style="color: rgb(127, 127, 127);">
                    <span style="color: rgb(89, 89, 89); font-size: 15px;">
                        <span data-custom-class="body_text">
                            <span style="font-size: 15px; color: rgb(89, 89, 89);">
                                <span style="font-size: 15px; color: rgb(89, 89, 89);">
                                    <span data-custom-class="body_text">
                                        <strong>
                                            <em>In Short:</em>
                                        </strong>
                                    </span>
                                </span>
                            </span>
                            <span data-custom-class="body_text">
                                <span style="font-size: 15px; color: rgb(89, 89, 89);">
                                    <span style="font-size: 15px; color: rgb(89, 89, 89);">
                                        <span data-custom-class="body_text">
                                            <em> Some information — such as your Internet Protocol (IP) address and/or browser and device characteristics — is collected automatically when you visit our Services.</em>
                                        </span>
                                    </span>
                                </span>
                            </span>
                        </span>
                    </span>
                </span>
            </div>

            <div style="line-height: 1.5;">
                <br>
            </div>

            <div style="line-height: 1.5;">
                <span style="font-size: 15px; color: rgb(89, 89, 89);">
                    <span style="font-size: 15px; color: rgb(89, 89, 89);">
                        <span data-custom-class="body_text">
                            We automatically collect certain information when you visit, use, or navigate the Services. This information does not reveal your specific identity (like your name or contact information) but may include device and usage information, such as your IP address, browser and device characteristics, operating system, language preferences, referring URLs, device name, country, location, information about how and when you use our Services, and other technical information.
                        </span>
                    </span>
                </span>
            </div>

            <div style="line-height: 1.5;">
                <br>
            </div>

            <div style="line-height: 1.5;">
                <span style="font-size: 15px; color: rgb(89, 89, 89);">
                    <span style="font-size: 15px; color: rgb(89, 89, 89);">
                        <span data-custom-class="body_text">
                            Like many businesses, we also collect information through cookies and similar technologies.
                        </span>
                    </span>
                </span>
            </div>

            <div style="line-height: 1.5;">
                <br>
            </div>

            <div style="line-height: 1.5;">
                <span style="font-size: 15px; color: rgb(89, 89, 89);">
                    <span style="font-size: 15px; color: rgb(89, 89, 89);">
                        <span data-custom-class="body_text">
                            The information we collect includes:
                        </span>
                    </span>
                </span>
            </div>

            <ul>
                <li data-custom-class="body_text" style="line-height: 1.5;">
                    <span style="font-size: 15px; color: rgb(89, 89, 89);">
                        <span style="font-size: 15px; color: rgb(89, 89, 89);">
                            <span data-custom-class="body_text">
                                <em>Location Data.</em> We collect location data such as information about your device's location, which can be either precise or imprecise. How much information we collect depends on the type and settings of the device you use to access the Services.
                            </span>
                        </span>
                    </span>
                </li>
            </ul>

            <div style="line-height: 1.5;">
                <br>
            </div>

            <div style="line-height: 1.5;">
                <span style="font-size: 15px;">
                    <strong>
                        <span data-custom-class="heading_2">
                            <h3>Google API</h3>
                        </span>
                    </strong>
                    <span data-custom-class="body_text">
                        Our use of information received from Google APIs will adhere to Google API Services User Data Policy, including the Limited Use requirements.
                    </span>
                </span>
            </div>

            <div style="line-height: 1.5;">
                <br>
            </div>

            <div id="infouse" style="line-height: 1.5;">
                <span style="color: rgb(127, 127, 127);">
                    <span style="color: rgb(89, 89, 89); font-size: 15px;">
                        <span style="font-size: 15px; color: rgb(89, 89, 89);">
                            <span style="font-size: 15px; color: rgb(89, 89, 89);">
                                <span id="control" style="color: rgb(0, 0, 0);">
                                    <strong>
                                        <span data-custom-class="heading_1">
                                            <h2>2. HOW DO WE PROCESS YOUR INFORMATION?</h2>
                                        </span>
                                    </strong>
                                </span>
                            </span>
                        </span>
                        <span data-custom-class="body_text">
                            <span style="font-size: 15px; color: rgb(89, 89, 89);">
                                <span style="font-size: 15px; color: rgb(89, 89, 89);">
                                    <span data-custom-class="body_text">
                                        <strong>
                                            <em>In Short: </em>
                                        </strong>
                                        <em>We process your information to provide, improve, and administer our Services, communicate with you, for security and fraud prevention, and to comply with law.</em>
                                    </span>
                                </span>
                            </span>
                        </span>
                    </span>
                </span>
            </div>

            <div style="line-height: 1.5;">
                <br>
            </div>

            <div style="line-height: 1.5;">
                <span style="font-size: 15px; color: rgb(89, 89, 89);">
                    <span style="font-size: 15px; color: rgb(89, 89, 89);">
                        <span data-custom-class="body_text">
                            <strong>We process your personal information for a variety of reasons, depending on how you interact with our Services, including:</strong>
                        </span>
                    </span>
                </span>
            </div>

            <ul>
                <li data-custom-class="body_text" style="line-height: 1.5;">
                    <span style="font-size: 15px; color: rgb(89, 89, 89);">
                        <span style="font-size: 15px; color: rgb(89, 89, 89);">
                            <span data-custom-class="body_text">
                                <strong>To facilitate account creation and authentication and otherwise manage user accounts.</strong> We may process your information so you can create and log in to your account, as well as keep your account in working order.
                            </span>
                        </span>
                    </span>
                </li>
                <li data-custom-class="body_text" style="line-height: 1.5;">
                    <span style="font-size: 15px; color: rgb(89, 89, 89);">
                        <span style="font-size: 15px; color: rgb(89, 89, 89);">
                            <span data-custom-class="body_text">
                                <strong>To respond to user inquiries/offer support to users.</strong> We may process your information to respond to your inquiries and solve any potential issues you might have with the requested service.
                            </span>
                        </span>
                    </span>
                </li>
                <li data-custom-class="body_text" style="line-height: 1.5;">
                    <span style="font-size: 15px; color: rgb(89, 89, 89);">
                        <span style="font-size: 15px; color: rgb(89, 89, 89);">
                            <span data-custom-class="body_text">
                                <strong>To send administrative information to you.</strong> We may process your information to send you details about our products and services, changes to our terms and policies, and other similar information.
                            </span>
                        </span>
                    </span>
                </li>
                <li data-custom-class="body_text" style="line-height: 1.5;">
                    <span style="font-size: 15px;">
                        <span style="color: rgb(89, 89, 89);">
                            <span style="color: rgb(89, 89, 89);">
                                <span data-custom-class="body_text">
                                    <strong>To enable user-to-user communications.</strong> We may process your information if you choose to use any of our offerings that allow for communication with another user.
                                </span>
                            </span>
                        </span>
                    </span>
                </li>
            </ul>

            <div style="line-height: 1.5;">
                <br>
            </div>

            <div id="legalbases" style="line-height: 1.5;">
                <strong>
                    <span style="font-size: 15px;">
                        <span data-custom-class="heading_1">
                            <h2>3. WHAT LEGAL BASES DO WE RELY ON TO PROCESS YOUR INFORMATION?</h2>
                        </span>
                    </span>
                </strong>
                <em>
                    <span style="font-size: 15px;">
                        <span data-custom-class="body_text">
                            <strong>In Short: </strong>We only process your personal information when we believe it is necessary and we have a valid legal reason to do so under applicable law, like with your consent, to comply with laws, to provide you with services to enter into or fulfill our contractual obligations, to protect your rights, or to fulfill our legitimate business interests.
                        </span>
                    </span>
                </em>
            </div>

            <div style="line-height: 1.5;">
                <br>
            </div>

            <div style="line-height: 1.5;">
                <em>
                    <span style="font-size: 15px;">
                        <span data-custom-class="body_text">
                            <strong>
                                <u>If you are located in the EU or UK, this section applies to you.</u>
                            </strong>
                        </span>
                    </span>
                </em>
            </div>

            <div style="line-height: 1.5;">
                <br>
            </div>

            <div style="line-height: 1.5;">
                <span style="font-size: 15px;">
                    <span data-custom-class="body_text">
                        The General Data Protection Regulation (GDPR) and UK GDPR require us to explain the valid legal bases we rely on in order to process your personal information. As such, we may rely on the following legal bases to process your personal information:
                    </span>
                </span>
            </div>

            <ul>
                <li data-custom-class="body_text" style="line-height: 1.5;">
                    <span style="font-size: 15px;">
                        <span data-custom-class="body_text">
                            <strong>Consent.</strong> We may process your information if you have given us permission to use your personal information for a specific purpose. You can withdraw your consent at any time.
                        </span>
                    </span>
                </li>
                <li data-custom-class="body_text" style="line-height: 1.5;">
                    <span data-custom-class="body_text">
                        <span style="font-size: 15px;">
                            <strong>Performance of a Contract.</strong> We may process your personal information when we believe it is necessary to fulfill our contractual obligations to you, including providing our Services or at your request prior to entering into a contract with you.
                        </span>
                    </span>
                </li>
                <li data-custom-class="body_text" style="line-height: 1.5;">
                    <span data-custom-class="body_text">
                        <span style="font-size: 15px;">
                            <strong>Legal Obligations.</strong> We may process your information where we believe it is necessary for compliance with our legal obligations, such as to cooperate with a law enforcement body or regulatory agency, exercise or defend our legal rights, or disclose your information as evidence in litigation in which we are involved.
                        </span>
                    </span>
                </li>
            </ul>

            <div style="line-height: 1.5;">
                <br>
            </div>

            <div style="line-height: 1.5;">
                <span data-custom-class="body_text">
                    <span style="font-size: 15px;">
                        <strong>
                            <u>
                                <em>If you are located in Canada, this section applies to you.</em>
                            </u>
                        </strong>
                    </span>
                </span>
            </div>

            <div style="line-height: 1.5;">
                <br>
            </div>

            <div style="line-height: 1.5;">
                <span data-custom-class="body_text">
                    <span style="font-size: 15px;">
                        We may process your information if you have given us specific permission to use your personal information for a specific purpose, or in situations where your permission can be inferred. You can withdraw your consent at any time.
                    </span>
                </span>
            </div>

            <div style="line-height: 1.5;">
                <br>
            </div>

            <div style="line-height: 1.5;">
                <span data-custom-class="body_text">
                    <span style="font-size: 15px;">
                        In some exceptional cases, we may be legally permitted under applicable law to process your information without your consent, including, for example:
                    </span>
                </span>
            </div>

            <ul>
                <li data-custom-class="body_text" style="line-height: 1.5;">
                    <span data-custom-class="body_text">
                        <span style="font-size: 15px;">
                            If collection is clearly in the interests of an individual and consent cannot be obtained in a timely way
                        </span>
                    </span>
                </li>
                <li data-custom-class="body_text" style="line-height: 1.5;">
                    <span data-custom-class="body_text">
                        <span style="font-size: 15px;">
                            For investigations and fraud detection and prevention
                        </span>
                    </span>
                </li>
                <li data-custom-class="body_text" style="line-height: 1.5;">
                    <span data-custom-class="body_text">
                        <span style="font-size: 15px;">
                            For business transactions provided certain conditions are met
                        </span>
                    </span>
                </li>
                <li data-custom-class="body_text" style="line-height: 1.5;">
                    <span data-custom-class="body_text">
                        <span style="font-size: 15px;">
                            If it is contained in a witness statement and the collection is necessary to assess, process, or settle an insurance claim
                        </span>
                    </span>
                </li>
            </ul>

            <div style="line-height: 1.5;">
                <br>
            </div>

            <div id="whoshare" style="line-height: 1.5;">
                <span style="color: rgb(127, 127, 127);">
                    <span style="color: rgb(89, 89, 89); font-size: 15px;">
                        <span style="font-size: 15px; color: rgb(89, 89, 89);">
                            <span style="font-size: 15px; color: rgb(89, 89, 89);">
                                <span id="control" style="color: rgb(0, 0, 0);">
                                    <strong>
                                        <span data-custom-class="heading_1">
                                            <h2>4. WHEN AND WITH WHOM DO WE SHARE YOUR PERSONAL INFORMATION?</h2>
                                        </span>
                                    </strong>
                                </span>
                            </span>
                        </span>
                    </span>
                </span>
                <span style="font-size: 15px; color: rgb(89, 89, 89);">
                    <span style="font-size: 15px; color: rgb(89, 89, 89);">
                        <span data-custom-class="body_text">
                            <strong>
                                <em>In Short:</em>
                            </strong>
                            <em> We may share information in specific situations described in this section and/or with the following third parties.</em>
                        </span>
                    </span>
                </span>
            </div>

            <div style="line-height: 1.5;">
                <br>
            </div>

            <div style="line-height: 1.5;">
                <span style="font-size: 15px;">
                    <span data-custom-class="body_text">
                        We may need to share your personal information in the following situations:
                    </span>
                </span>
            </div>

            <ul>
                <li data-custom-class="body_text" style="line-height: 1.5;">
                    <span style="font-size: 15px;">
                        <span data-custom-class="body_text">
                            <strong>Business Transfers.</strong> We may share or transfer your information in connection with, or during negotiations of, any merger, sale of company assets, financing, or acquisition of all or a portion of our business to another company.
                        </span>
                    </span>
                </li>
                <li data-custom-class="body_text" style="line-height: 1.5;">
                    <span style="font-size: 15px;">
                        <span data-custom-class="body_text">
                            <strong>Affiliates.</strong> We may share your information with our affiliates, in which case we will require those affiliates to honor this Privacy Notice.
                        </span>
                    </span>
                </li>
                <li data-custom-class="body_text" style="line-height: 1.5;">
                    <span data-custom-class="body_text">
                        <span style="font-size: 15px;">
                            <strong>Business Partners.</strong> We may share your information with our business partners to offer you certain products, services, or promotions.
                        </span>
                    </span>
                </li>
            </ul>

            <div style="line-height: 1.5;">
                <br>
            </div>

            <div id="cookies" style="line-height: 1.5;">
                <span style="color: rgb(127, 127, 127);">
                    <span style="color: rgb(89, 89, 89); font-size: 15px;">
                        <span style="font-size: 15px; color: rgb(89, 89, 89);">
                            <span style="font-size: 15px; color: rgb(89, 89, 89);">
                                <span id="control" style="color: rgb(0, 0, 0);">
                                    <strong>
                                        <span data-custom-class="heading_1">
                                            <h2>5. DO WE USE COOKIES AND OTHER TRACKING TECHNOLOGIES?</h2>
                                        </span>
                                    </strong>
                                </span>
                            </span>
                        </span>
                    </span>
                </span>
                <span style="font-size: 15px; color: rgb(89, 89, 89);">
                    <span style="font-size: 15px; color: rgb(89, 89, 89);">
                        <span data-custom-class="body_text">
                            <strong>
                                <em>In Short:</em>
                            </strong>
                            <em> We may use cookies and other tracking technologies to collect and store your information.</em>
                        </span>
                    </span>
                </span>
            </div>

            <div style="line-height: 1.5;">
                <br>
            </div>

            <div style="line-height: 1.5;">
                <span style="font-size: 15px; color: rgb(89, 89, 89);">
                    <span style="font-size: 15px; color: rgb(89, 89, 89);">
                        <span data-custom-class="body_text">
                            We may use cookies and similar tracking technologies (like web beacons and pixels) to gather information when you interact with our Services. Some online tracking technologies help us maintain the security of our Services and your account, prevent crashes, fix bugs, save your preferences, and assist with basic site functions.
                        </span>
                    </span>
                </span>
            </div>

            <div style="line-height: 1.5;">
                <br>
            </div>

            <div style="line-height: 1.5;">
                <span style="font-size: 15px; color: rgb(89, 89, 89);">
                    <span style="font-size: 15px; color: rgb(89, 89, 89);">
                        <span data-custom-class="body_text">
                            We also permit third parties and service providers to use online tracking technologies on our Services for analytics and advertising, including to help manage and display advertisements or to tailor advertisements to your interests.
                        </span>
                    </span>
                </span>
            </div>

            <div style="line-height: 1.5;">
                <br>
            </div>

            <div id="ai" style="line-height: 1.5;">
                <span style="font-size: 15px;">
                    <strong>
                        <span data-custom-class="heading_1">
                            <h2>6. DO WE OFFER ARTIFICIAL INTELLIGENCE-BASED PRODUCTS?</h2>
                        </span>
                    </strong>
                    <strong>
                        <em>
                            <span data-custom-class="body_text">In Short:</span>
                        </em>
                    </strong>
                    <em>
                        <span data-custom-class="body_text"> We offer products, features, or tools powered by artificial intelligence, machine learning, or similar technologies.</span>
                    </em>
                </span>
            </div>

            <div style="line-height: 1.5;">
                <br>
            </div>

            <div style="line-height: 1.5;">
                <span style="font-size: 15px;">
                    <span data-custom-class="body_text">
                        As part of our Services, we offer products, features, or tools powered by artificial intelligence, machine learning, or similar technologies (collectively, "AI Products"). These tools are designed to enhance your experience and provide you with innovative solutions. The terms in this Privacy Notice govern your use of the AI Products within our Services.
                    </span>
                </span>
            </div>

            <div style="line-height: 1.5;">
                <br>
            </div>

            <div style="line-height: 1.5;">
                <span style="font-size: 15px;">
                    <strong>
                        <span data-custom-class="body_text">Our AI Products</span>
                    </strong>
                </span>
            </div>

            <div style="line-height: 1.5;">
                <br>
            </div>

            <div style="line-height: 1.5;">
                <span style="font-size: 15px;">
                    <span data-custom-class="body_text">
                        Our AI Products are designed for the following functions:
                    </span>
                </span>
            </div>

            <ul>
                <li data-custom-class="body_text" style="line-height: 1.5;">
                    <span style="font-size: 15px;">
                        <span data-custom-class="body_text">AI predictive analytics</span>
                    </span>
                </li>
            </ul>

            <div style="line-height: 1.5;">
                <br>
            </div>

            <div style="line-height: 1.5;">
                <span style="font-size: 15px;">
                    <strong>
                        <span data-custom-class="body_text">How We Process Your Data Using AI</span>
                    </strong>
                </span>
            </div>

            <div style="line-height: 1.5;">
                <br>
            </div>

            <div style="line-height: 1.5;">
                <span style="font-size: 15px;">
                    <span data-custom-class="body_text">
                        All personal information processed using our AI Products is handled in line with our Privacy Notice and our agreement with third parties. This ensures high security and safeguards your personal information throughout the process, giving you peace of mind about your data's safety.
                    </span>
                </span>
            </div>

            <div style="line-height: 1.5;">
                <br>
            </div>

            <div id="intltransfers" style="line-height: 1.5;">
                <span style="color: rgb(127, 127, 127);">
                    <span style="color: rgb(89, 89, 89); font-size: 15px;">
                        <span style="font-size: 15px; color: rgb(89, 89, 89);">
                            <span style="font-size: 15px; color: rgb(89, 89, 89);">
                                <span id="control" style="color: rgb(0, 0, 0);">
                                    <strong>
                                        <span data-custom-class="heading_1">
                                            <h2>7. IS YOUR INFORMATION TRANSFERRED INTERNATIONALLY?</h2>
                                        </span>
                                    </strong>
                                </span>
                            </span>
                        </span>
                    </span>
                </span>
                <span style="font-size: 15px; color: rgb(89, 89, 89);">
                    <span style="font-size: 15px; color: rgb(89, 89, 89);">
                        <span data-custom-class="body_text">
                            <strong>
                                <em>In Short: </em>
                            </strong>
                            <em>We may transfer, store, and process your information in countries other than your own.</em>
                        </span>
                    </span>
                </span>
            </div>

            <div style="line-height: 1.5;">
                <br>
            </div>

            <div data-custom-class="body_text" style="line-height: 1.5;">
                <span style="font-size: 15px; color: rgb(89, 89, 89);">
                    <span style="font-size: 15px; color: rgb(89, 89, 89);">
                        <span data-custom-class="body_text">
                            Our servers are located in South Africa. Regardless of your location, please be aware that your information may be transferred to, stored by, and processed by us in our facilities and in the facilities of the third parties with whom we may share your personal information, including facilities in South Africa and other countries.
                        </span>
                    </span>
                </span>
            </div>

            <div style="line-height: 1.5;">
                <br>
            </div>

            <div style="line-height: 1.5;">
                <span style="font-size: 15px; color: rgb(89, 89, 89);">
                    <span style="font-size: 15px; color: rgb(89, 89, 89);">
                        <span data-custom-class="body_text">
                            If you are a resident in the European Economic Area (EEA), United Kingdom (UK), or Switzerland, then these countries may not necessarily have data protection laws or other similar laws as comprehensive as those in your country. However, we will take all necessary measures to protect your personal information in accordance with this Privacy Notice and applicable law.
                        </span>
                    </span>
                </span>
            </div>

            <div style="line-height: 1.5;">
                <br>
            </div>

            <div id="inforetain" style="line-height: 1.5;">
                <span style="color: rgb(127, 127, 127);">
                    <span style="color: rgb(89, 89, 89); font-size: 15px;">
                        <span style="font-size: 15px; color: rgb(89, 89, 89);">
                            <span style="font-size: 15px; color: rgb(89, 89, 89);">
                                <span id="control" style="color: rgb(0, 0, 0);">
                                    <strong>
                                        <span data-custom-class="heading_1">
                                            <h2>8. HOW LONG DO WE KEEP YOUR INFORMATION?</h2>
                                        </span>
                                    </strong>
                                </span>
                            </span>
                        </span>
                    </span>
                </span>
                <span style="font-size: 15px; color: rgb(89, 89, 89);">
                    <span style="font-size: 15px; color: rgb(89, 89, 89);">
                        <span data-custom-class="body_text">
                            <strong>
                                <em>In Short: </em>
                            </strong>
                            <em>We keep your information for as long as necessary to fulfill the purposes outlined in this Privacy Notice unless otherwise required by law.</em>
                        </span>
                    </span>
                </span>
            </div>

            <div style="line-height: 1.5;">
                <br>
            </div>

            <div style="line-height: 1.5;">
                <span style="font-size: 15px; color: rgb(89, 89, 89);">
                    <span style="font-size: 15px; color: rgb(89, 89, 89);">
                        <span data-custom-class="body_text">
                            We will only keep your personal information for as long as it is necessary for the purposes set out in this Privacy Notice, unless a longer retention period is required or permitted by law (such as tax, accounting, or other legal requirements).
                        </span>
                    </span>
                </span>
            </div>

            <div style="line-height: 1.5;">
                <br>
            </div>

            <div style="line-height: 1.5;">
                <span style="font-size: 15px; color: rgb(89, 89, 89);">
                    <span style="font-size: 15px; color: rgb(89, 89, 89);">
                        <span data-custom-class="body_text">
                            When we have no ongoing legitimate business need to process your personal information, we will either delete or anonymize such information, or, if this is not possible, then we will securely store your personal information and isolate it from any further processing until deletion is possible.
                        </span>
                    </span>
                </span>
            </div>

            <div style="line-height: 1.5;">
                <br>
            </div>

            <div id="infominors" style="line-height: 1.5;">
                <span style="color: rgb(127, 127, 127);">
                    <span style="color: rgb(89, 89, 89); font-size: 15px;">
                        <span style="font-size: 15px; color: rgb(89, 89, 89);">
                            <span style="font-size: 15px; color: rgb(89, 89, 89);">
                                <span id="control" style="color: rgb(0, 0, 0);">
                                    <strong>
                                        <span data-custom-class="heading_1">
                                            <h2>9. DO WE COLLECT INFORMATION FROM MINORS?</h2>
                                        </span>
                                    </strong>
                                </span>
                            </span>
                        </span>
                    </span>
                </span>
                <span style="font-size: 15px; color: rgb(89, 89, 89);">
                    <span style="font-size: 15px; color: rgb(89, 89, 89);">
                        <span data-custom-class="body_text">
                            <strong>
                                <em>In Short:</em>
                            </strong>
                            <em> We do not knowingly collect data from or market to children under 18 years of age.</em>
                        </span>
                    </span>
                </span>
            </div>

            <div style="line-height: 1.5;">
                <br>
            </div>

            <div style="line-height: 1.5;">
                <span style="font-size: 15px; color: rgb(89, 89, 89);">
                    <span style="font-size: 15px; color: rgb(89, 89, 89);">
                        <span data-custom-class="body_text">
                            We do not knowingly collect, solicit data from, or market to children under 18 years of age, nor do we knowingly sell such personal information. By using the Services, you represent that you are at least 18 or that you are the parent or guardian of such a minor and consent to such minor dependent's use of the Services. If we learn that personal information from users less than 18 years of age has been collected, we will deactivate the account and take reasonable measures to promptly delete such data from our records. If you become aware of any data we may have collected from children under age 18, please contact us at <a target="_blank" data-custom-class="link" href="mailto:tyrontshabalala64@gmail.com">tyrontshabalala64@gmail.com</a>.
                        </span>
                    </span>
                </span>
            </div>

            <div style="line-height: 1.5;">
                <br>
            </div>

            <div id="privacyrights" style="line-height: 1.5;">
                <span style="color: rgb(127, 127, 127);">
                    <span style="color: rgb(89, 89, 89); font-size: 15px;">
                        <span style="font-size: 15px; color: rgb(89, 89, 89);">
                            <span style="font-size: 15px; color: rgb(89, 89, 89);">
                                <span id="control" style="color: rgb(0, 0, 0);">
                                    <strong>
                                        <span data-custom-class="heading_1">
                                            <h2>10. WHAT ARE YOUR PRIVACY RIGHTS?</h2>
                                        </span>
                                    </strong>
                                </span>
                            </span>
                        </span>
                    </span>
                </span>
                <span style="font-size: 15px; color: rgb(89, 89, 89);">
                    <span style="font-size: 15px; color: rgb(89, 89, 89);">
                        <span data-custom-class="body_text">
                            <strong>
                                <em>In Short:</em>
                            </strong>
                            <em> Depending on your state of residence in the US or in some regions, such as the European Economic Area (EEA), United Kingdom (UK), Switzerland, and Canada, you have rights that allow you greater access to and control over your personal information. You may review, change, or terminate your account at any time, depending on your country, province, or state of residence.</em>
                        </span>
                    </span>
                </span>
            </div>

            <div style="line-height: 1.5;">
                <br>
            </div>

            <div style="line-height: 1.5;">
                <span style="font-size: 15px; color: rgb(89, 89, 89);">
                    <span style="font-size: 15px; color: rgb(89, 89, 89);">
                        <span data-custom-class="body_text">
                            In some regions (like the EEA, UK, Switzerland, and Canada), you have certain rights under applicable data protection laws. These may include the right (i) to request access and obtain a copy of your personal information, (ii) to request rectification or erasure; (iii) to restrict the processing of your personal information; (iv) if applicable, to data portability; and (v) not to be subject to automated decision-making.
                        </span>
                    </span>
                </span>
            </div>

            <div style="line-height: 1.5;">
                <br>
            </div>

            <div style="line-height: 1.5;">
                <span style="font-size: 15px; color: rgb(89, 89, 89);">
                    <span style="font-size: 15px; color: rgb(89, 89, 89);">
                        <span data-custom-class="body_text">
                            We will consider and act upon any request in accordance with applicable data protection laws.
                        </span>
                    </span>
                </span>
            </div>

            <div style="line-height: 1.5;">
                <br>
            </div>

            <div style="line-height: 1.5;">
                <span style="font-size: 15px;">
                    <span data-custom-class="body_text">
                        If you are located in the UK and are unhappy with how we have handled your personal information, you can make a complaint directly to us. This is in addition to the rights you have under the UK General Data Protection Regulation and the Data Protection Act 2018.
                    </span>
                </span>
            </div>

            <div style="line-height: 1.5;">
                <br>
            </div>

            <div style="line-height: 1.5;">
                <span style="font-size: 15px;">
                    <span data-custom-class="body_text">
                        <strong><u>Withdrawing your consent:</u></strong> If we are relying on your consent to process your personal information, you have the right to withdraw your consent at any time. You can withdraw your consent at any time by contacting us at <a target="_blank" data-custom-class="link" href="mailto:tyrontshabalala64@gmail.com">tyrontshabalala64@gmail.com</a>.
                    </span>
                </span>
            </div>

            <div style="line-height: 1.5;">
                <br>
            </div>

            <div style="line-height: 1.5;">
                <span style="font-size: 15px;">
                    <span data-custom-class="body_text">
                        However, please note that this will not affect the lawfulness of the processing before its withdrawal nor will it affect the processing of your personal information conducted in reliance on lawful processing grounds other than consent.
                    </span>
                </span>
            </div>

            <div style="line-height: 1.5;">
                <br>
            </div>

            <div style="line-height: 1.5;">
                <span style="font-size: 15px;">
                    <span data-custom-class="heading_2">
                        <strong>
                            <h3>Account Information</h3>
                        </strong>
                    </span>
                    <span data-custom-class="body_text">
                        <span style="font-size: 15px;">
                            If you would at any time like to review or change the information in your account or terminate your account, you can:
                        </span>
                    </span>
                </span>
            </div>

            <ul>
                <li data-custom-class="body_text" style="line-height: 1.5;">
                    <span data-custom-class="body_text">
                        <span style="font-size: 15px;">Log in to your account settings and update your user account.</span>
                    </span>
                </li>
            </ul>

            <div style="line-height: 1.5;">
                <span style="font-size: 15px;">
                    <span data-custom-class="body_text">
                        Upon your request to terminate your account, we will deactivate or delete your account and information from our active databases. However, we may retain some information in our files to prevent fraud, troubleshoot problems, assist with any investigations, enforce our legal terms and/or comply with applicable legal requirements.
                    </span>
                </span>
            </div>

            <div style="line-height: 1.5;">
                <br>
            </div>

            <div id="DNT" style="line-height: 1.5;">
                <span style="color: rgb(127, 127, 127);">
                    <span style="color: rgb(89, 89, 89); font-size: 15px;">
                        <span style="font-size: 15px; color: rgb(89, 89, 89);">
                            <span style="font-size: 15px; color: rgb(89, 89, 89);">
                                <span id="control" style="color: rgb(0, 0, 0);">
                                    <strong>
                                        <span data-custom-class="heading_1">
                                            <h2>11. CONTROLS FOR DO-NOT-TRACK FEATURES</h2>
                                        </span>
                                    </strong>
                                </span>
                            </span>
                        </span>
                    </span>
                </span>
                <span style="font-size: 15px; color: rgb(89, 89, 89);">
                    <span style="font-size: 15px; color: rgb(89, 89, 89);">
                        <span data-custom-class="body_text">
                            Most web browsers and some mobile operating systems and mobile applications include a Do-Not-Track ("DNT") feature or setting you can activate to signal your privacy preference not to have data about your online browsing activities monitored and collected. At this stage, no uniform technology standard for recognizing and implementing DNT signals has been finalized. As such, we do not currently respond to DNT browser signals or any other mechanism that automatically communicates your choice not to be tracked online. If a standard for online tracking is adopted that we must follow in the future, we will inform you about that practice in a revised version of this Privacy Notice.
                        </span>
                    </span>
                </span>
            </div>

            <div style="line-height: 1.5;">
                <br>
            </div>

            <div style="line-height: 1.5;">
                <span style="font-size: 15px;">
                    <span data-custom-class="body_text">
                        California law requires us to let you know how we respond to web browser DNT signals. Because there currently is not an industry or legal standard for recognizing or honoring DNT signals, we do not respond to them at this time.
                    </span>
                </span>
            </div>

            <div style="line-height: 1.5;">
                <br>
            </div>

            <div id="uslaws" style="line-height: 1.5;">
                <span style="color: rgb(127, 127, 127);">
                    <span style="color: rgb(89, 89, 89); font-size: 15px;">
                        <span style="font-size: 15px; color: rgb(89, 89, 89);">
                            <span style="font-size: 15px; color: rgb(89, 89, 89);">
                                <span id="control" style="color: rgb(0, 0, 0);">
                                    <strong>
                                        <span data-custom-class="heading_1">
                                            <h2>12. DO UNITED STATES RESIDENTS HAVE SPECIFIC PRIVACY RIGHTS?</h2>
                                        </span>
                                    </strong>
                                </span>
                            </span>
                        </span>
                    </span>
                </span>
                <span style="font-size: 15px; color: rgb(89, 89, 89);">
                    <span style="font-size: 15px; color: rgb(89, 89, 89);">
                        <span data-custom-class="body_text">
                            <strong>
                                <em>In Short: </em>
                            </strong>
                            <em>If you are a resident of California, you may have the right to request access to and receive details about the personal information we maintain about you and how we have processed it, correct inaccuracies, get a copy of, or delete your personal information. These rights may be limited in some circumstances by applicable law.</em>
                        </span>
                    </span>
                </span>
            </div>

            <div style="line-height: 1.5;">
                <br>
            </div>

            <div id="policyupdates" style="line-height: 1.5;">
                <span style="color: rgb(127, 127, 127);">
                    <span style="color: rgb(89, 89, 89); font-size: 15px;">
                        <span style="font-size: 15px; color: rgb(89, 89, 89);">
                            <span style="font-size: 15px; color: rgb(89, 89, 89);">
                                <span id="control" style="color: rgb(0, 0, 0);">
                                    <strong>
                                        <span data-custom-class="heading_1">
                                            <h2>13. DO WE MAKE UPDATES TO THIS NOTICE?</h2>
                                        </span>
                                    </strong>
                                </span>
                            </span>
                        </span>
                    </span>
                </span>
                <span style="font-size: 15px; color: rgb(89, 89, 89);">
                    <span style="font-size: 15px; color: rgb(89, 89, 89);">
                        <span data-custom-class="body_text">
                            <em>
                                <strong>In Short: </strong>Yes, we will update this notice as necessary to stay compliant with relevant laws.
                            </em>
                        </span>
                    </span>
                </span>
            </div>

            <div style="line-height: 1.5;">
                <br>
            </div>

            <div style="line-height: 1.5;">
                <span style="font-size: 15px; color: rgb(89, 89, 89);">
                    <span style="font-size: 15px; color: rgb(89, 89, 89);">
                        <span data-custom-class="body_text">
                            We may update this Privacy Notice from time to time. The updated version will be indicated by an updated "Revised" date at the top of this Privacy Notice. If we make material changes to this Privacy Notice, we may notify you either by prominently posting a notice of such changes or by directly sending you a notification. We encourage you to review this Privacy Notice frequently to be informed of how we are protecting your information.
                        </span>
                    </span>
                </span>
            </div>

            <div style="line-height: 1.5;">
                <br>
            </div>

            <div id="contact" style="line-height: 1.5;">
                <span style="color: rgb(127, 127, 127);">
                    <span style="color: rgb(89, 89, 89); font-size: 15px;">
                        <span style="font-size: 15px; color: rgb(89, 89, 89);">
                            <span style="font-size: 15px; color: rgb(89, 89, 89);">
                                <span id="control" style="color: rgb(0, 0, 0);">
                                    <strong>
                                        <span data-custom-class="heading_1">
                                            <h2>14. HOW CAN YOU CONTACT US ABOUT THIS NOTICE?</h2>
                                        </span>
                                    </strong>
                                </span>
                            </span>
                        </span>
                    </span>
                </span>
                <span style="font-size: 15px; color: rgb(89, 89, 89);">
                    <span style="font-size: 15px; color: rgb(89, 89, 89);">
                        <span data-custom-class="body_text">
                            If you have questions or comments about this notice, you may email us at <a target="_blank" data-custom-class="link" href="mailto:tyrontshabalala64@gmail.com">tyrontshabalala64@gmail.com</a> or contact us by post at:
                        </span>
                    </span>
                </span>
            </div>

            <div style="line-height: 1.5;">
                <br>
            </div>

            <div style="line-height: 1.5;">
                <span style="font-size: 15px; color: rgb(89, 89, 89);">
                    <span style="font-size: 15px; color: rgb(89, 89, 89);">
                        <span data-custom-class="body_text">
                            <strong>Footballa</strong>
                            <br>
                            South Africa
                        </span>
                    </span>
                </span>
            </div>

            <div style="line-height: 1.5;">
                <br>
            </div>

            <div id="request" style="line-height: 1.5;">
                <span style="color: rgb(127, 127, 127);">
                    <span style="color: rgb(89, 89, 89); font-size: 15px;">
                        <span style="font-size: 15px; color: rgb(89, 89, 89);">
                            <span style="font-size: 15px; color: rgb(89, 89, 89);">
                                <span id="control" style="color: rgb(0, 0, 0);">
                                    <strong>
                                        <span data-custom-class="heading_1">
                                            <h2>15. HOW CAN YOU REVIEW, UPDATE, OR DELETE THE DATA WE COLLECT FROM YOU?</h2>
                                        </span>
                                    </strong>
                                </span>
                            </span>
                        </span>
                    </span>
                </span>
                <span style="font-size: 15px; color: rgb(89, 89, 89);">
                    <span style="font-size: 15px; color: rgb(89, 89, 89);">
                        <span data-custom-class="body_text">
                            Based on the applicable laws of your country or state of residence in the US, you may have the right to request access to the personal information we collect from you, details about how we have processed it, correct inaccuracies, or delete your personal information. You may also have the right to withdraw your consent to our processing of your personal information. These rights may be limited in some circumstances by applicable law. To request to review, update, or delete your personal information, please <a data-custom-class="link" href="https://app.termly.io/dsar/f95f0d67-0c72-433d-a842-a434e7281f17" rel="noopener noreferrer" target="_blank">submit a data subject access request</a>.
                        </span>
                    </span>
                </span>
            </div>

            <div style="line-height: 1.5;">
                <br>
            </div>

            <div>
                <span data-custom-class="body_text">
                    This Privacy Policy was created using Termly's Privacy Policy Generator.
                </span>
            </div>
        </div>
    `

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 px-4 py-6 pb-20 transition-colors duration-200">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <button 
                    onClick={() => navigate(-1)}
                    className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition"
                >
                    <ChevronLeft size={24} className="text-gray-700 dark:text-gray-300" />
                </button>
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                    <Shield size={24} /> Privacy Policy
                </h1>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 transition-colors duration-200">
                <div 
                    className="prose prose-sm dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: privacyContent }}
                />
            </div>
        </div>
    )
}