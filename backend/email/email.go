package email

import (
	"bytes"
	"fmt"
	"log"
	"net/smtp"
	"os"
	"path/filepath"
	"regexp"
	"runtime"
	"strings"
	"text/template"

	"github.com/kisbogdan-kolos/lego-pincer/backend/helper"
)

var auth smtp.Auth
var server string
var mailFrom string

type email struct {
	Recipient string
	Subject   string
	Message   string
}

var queue = make(chan email, 10)

type OrderTemplateData struct {
	UserName   string
	ItemName   string
	Quantity   uint
	Bonus      string
	TotalPrice string
	EditLink   string
}

type OrderCancellationTemplateData struct {
	UserName   string
	OrderUUID  string
	ItemName   string
	Quantity   uint
	Bonus      string
	TotalPrice string
}

func Init() error {
	server = helper.EnvGet("SMTP_SERVER", "")
	mailFrom = helper.EnvGet("SMTP_MAIL_FROM", "")

	parts := strings.Split(server, ":")
	if len(parts) != 2 {
		return fmt.Errorf("SMTP server format incorrect: must include a port")
	}

	username := helper.EnvGet("SMTP_USER", "")
	password := helper.EnvGet("SMTP_PASS", "")

	auth = smtp.PlainAuth("", username, password, parts[0])

	go func() {
		for email := range queue {
			err := Send(email.Recipient, email.Subject, email.Message)

			if err != nil {
				log.Printf("Failed to send mail: %v", err)
			}
		}
	}()

	return nil
}

func Send(recipient string, subject string, message string) error {
	if strings.ContainsAny(recipient, "\r\n\t") {
		return fmt.Errorf("recipient format incorrect: must not include newline or tabs")
	}

	if strings.ContainsAny(subject, "\r\n\t") {
		return fmt.Errorf("subject format incorrect: must not include newline or tabs")
	}

	msg := fmt.Sprintf("From: %s\r\nTo: %s\r\nSubject: %s\r\n\r\n%s\r\n", mailFrom, recipient, subject, message)

	return smtp.SendMail(server, auth, stripMail(mailFrom), []string{stripMail(recipient)}, []byte(msg))
}

func SendEnqueue(recipient string, subject string, message string) error {
	queue <- email{
		Recipient: recipient,
		Subject:   subject,
		Message:   message,
	}

	return nil
}

func RenderTemplate(name string, data any) (string, error) {
	_, filePath, _, ok := runtime.Caller(0)
	if !ok {
		return "", fmt.Errorf("could not determine email package path")
	}

	templatePath := filepath.Join(filepath.Dir(filePath), "templates", name)
	content, err := os.ReadFile(templatePath)
	if err != nil {
		return "", err
	}

	tmpl, err := template.New(name).Parse(string(content))
	if err != nil {
		return "", err
	}

	var buffer bytes.Buffer
	if err := tmpl.Execute(&buffer, data); err != nil {
		return "", err
	}

	return buffer.String(), nil
}

func RenderOrderConfirmation(data OrderTemplateData) (string, error) {
	return RenderTemplate("order_confirmation.tmpl", data)
}

func RenderOrderCancellation(data OrderCancellationTemplateData) (string, error) {
	return RenderTemplate("order_cancellation.tmpl", data)
}

func stripMail(emailAddress string) string {
	re := regexp.MustCompile("^.*?<(.*?)>$")

	if re.Match([]byte(emailAddress)) {
		return re.FindStringSubmatch(emailAddress)[1]
	}

	return emailAddress
}
