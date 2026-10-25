// Blue/orange SDDM greeter, palette matches the dotfiles (kitty/waybar/wofi)
import QtQuick 2.7
import QtQuick.Controls 2.5
import QtQuick.Layouts 1.3

Item {
    id: root
    width: 400
    height: 500
    anchors.centerIn: parent

    // Provided by SDDM
    property var sessionModel: sessionModel
    // Filled by SDDM (display model)
    property string displayHostname: ""
    property string displayPrompt: ""
    property string displayWelcome: ""
    property string displayWarning: ""
    property string displayStatus: ""
    property string displayStatusWarning: ""

    function loginUser(user, password) {
        var name = (sessionModel && sessionModel.count > 0)
                 ? sessionModel.get(sessionModel.index).name : ""
        sddm.loginUser(user, password, name)
    }

    Rectangle {
        id: panel
        anchors.fill: parent
        color: "#0B1B2B"
        border.color: "#FF9E3D"
        border.width: 2
        radius: 12

        ColumnLayout {
            anchors.centerIn: parent
            width: 300
            spacing: 16

            Label {
                Layout.alignment: Qt.AlignHCenter
                text: displayWelcome !== "" ? displayWelcome : "Log in"
                font.family: "Iosevka"
                font.pixelSize: 28
                font.bold: true
                color: "#FF9E3D"
            }

            Label {
                Layout.alignment: Qt.AlignHCenter
                text: displayPrompt
                visible: displayPrompt !== ""
                font.family: "Iosevka"
                font.pixelSize: 13
                color: "#79C6F2"
            }

            ComboBox {
                id: sessionBox
                Layout.fillWidth: true
                model: sessionModel
                textRole: "name"
                valueRole: "name"
                currentIndex: sessionModel.index
                font.family: "Iosevka"
                font.pixelSize: 14
            }

            TextField {
                id: usernameField
                Layout.fillWidth: true
                placeholderText: "Username"
                font.family: "Iosevka"
                font.pixelSize: 14
            }

            TextField {
                id: passwordField
                Layout.fillWidth: true
                placeholderText: "Password"
                echoMode: TextInput.Password
                visiblePasswordCheckBox: true
                font.family: "Iosevka"
                font.pixelSize: 14
                onAccepted: loginUser(usernameField.text, passwordField.text)
            }

            Button {
                id: loginButton
                Layout.fillWidth: true
                text: "Log in"
                font.family: "Iosevka"
                font.pixelSize: 16
                font.bold: true
                onClicked: loginUser(usernameField.text, passwordField.text)
            }

            Label {
                Layout.fillWidth: true
                wrapMode: Text.WordWrap
                text: displayWarning !== "" ? displayWarning
                     : (displayStatusWarning !== "" ? displayStatusWarning : displayStatus)
                visible: text !== ""
                horizontalAlignment: Text.AlignHCenter
                font.family: "Iosevka"
                font.pixelSize: 12
                color: "#FF8A5C"
            }
        }
    }
}
