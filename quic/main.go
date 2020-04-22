package main

import (
	"fmt"
	"net/http"

	"github.com/lucas-clemente/quic-go/http3"
)

func main() {

	bind := "0.0.0.0:8089"

	certFile := "keys/fullchain.pem"
	keyFile := "keys/privkey.pem"

	http.Handle("/", http.FileServer(http.Dir("media")))
	if err := http3.ListenAndServeQUIC(bind, certFile, keyFile, nil); err != nil {
		fmt.Println(err)
	}

}